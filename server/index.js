// ------
const cors = require("cors");

const corsOptions = {
  origin: "*",
};

//--------------

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const server = require("http").createServer(app);
const io = require("socket.io")(server);
const config = require("./config/key");

const mongoose = require("mongoose");

// Peerjs
const {ExpressPeerServer} = require('peer')
const {v4: uuidv4} = require('uuid')
const groupCallHandler = require('./groupCallHandler')

const peerServer = ExpressPeerServer(server, {
  debug: true
})

app.use('/peerjs', peerServer)
groupCallHandler.createPeerServerListeners(peerServer);

// ---------------------------
const connect = mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));

const { Chat } = require("./models/Chat");
const { auth } = require("./middleware/auth");

app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));


const multer = require("multer");
const fs = require("fs");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`)
  },
  // fileFilter: (req, file, cb) => {
  //   const ext = path.extname(file.originalname)
  //   if (ext !== '.jpg' && ext !== '.png' && ext !== '.mp4') {
  //     return cb(res.status(400).end('only jpg, png, mp4 is allowed'), false);
  //   }
  //   cb(null, true)
  // }
})
 
var upload = multer({ storage: storage }).single("file")

app.post("/api/chat/uploadfiles", auth ,(req, res) => {
  upload(req, res, err => {
    if(err) {
      return res.json({ success: false, err })
    }
    return res.json({ success: true, url: res.req.file.path });
  })
});

let peers = [];
let groupCallRooms = [];

const broadcastEventTypes = {
  ACTIVE_USERS: 'ACTIVE_USERS',
  GROUP_CALL_ROOMS: 'GROUP_CALL_ROOMS'
};

io.on("connection", socket => {
  socket.emit("connection", null)
  console.log('new user connected');
  console.log(socket.id);
  
  socket.on('register-new-user', (data) => {
    peers.push({
      username: data.username,
      socketId: data.socketId
    });
    console.log('registered new user');
    console.log(peers);

    io.sockets.emit('broadcast', {
      event: broadcastEventTypes.ACTIVE_USERS,
      activeUsers: peers
    });
    io.sockets.emit('broadcast', {
      event: broadcastEventTypes.GROUP_CALL_ROOMS,
      groupCallRooms
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    peers = peers.filter(peer => peer.socketId !== socket.id);
    io.sockets.emit('broadcast', {
      event: broadcastEventTypes.ACTIVE_USERS,
      activeUsers: peers
    });

    groupCallRooms = groupCallRooms.filter(room => room.socketId !== socket.id);
    io.sockets.emit('broadcast', {
      event: broadcastEventTypes.GROUP_CALL_ROOMS,
      groupCallRooms
    });
  });

  // listeners related with direct call

  socket.on('pre-offer', (data) => {
    console.log('pre-offer handled');
    io.to(data.callee.socketId).emit('pre-offer', {
      callerUsername: data.caller.username,
      callerSocketId: socket.id
    });
  });

  socket.on('pre-offer-answer', (data) => {
    console.log('handling pre offer answer');
    io.to(data.callerSocketId).emit('pre-offer-answer', {
      answer: data.answer
    });
  });

  socket.on('webRTC-offer', (data) => {
    console.log('handling webRTC offer');
    io.to(data.calleeSocketId).emit('webRTC-offer', {
      offer: data.offer
    });
  });

  socket.on('webRTC-answer', (data) => {
    console.log('handling webRTC answer');
    io.to(data.callerSocketId).emit('webRTC-answer', {
      answer: data.answer
    });
  });

  socket.on('webRTC-candidate', (data) => {
    console.log('handling ice candidate');
    io.to(data.connectedUserSocketId).emit('webRTC-candidate', {
      candidate: data.candidate
    });
  });

  socket.on('user-hanged-up', (data) => {
    io.to(data.connectedUserSocketId).emit('user-hanged-up');
  });

   // listeners related with group call
   socket.on('group-call-register', (data) => {
    const roomId = uuidv4();
    socket.join(roomId);

    const newGroupCallRoom = {
      peerId: data.peerId,
      hostName: data.username,
      socketId: socket.id,
      roomId: roomId
    };

    groupCallRooms.push(newGroupCallRoom);
    io.sockets.emit('broadcast', {
      event: broadcastEventTypes.GROUP_CALL_ROOMS,
      groupCallRooms
    });
  });

  socket.on('group-call-join-request', (data) => {
    io.to(data.roomId).emit('group-call-join-request', {
      peerId: data.peerId,
      streamId: data.streamId
    });

    socket.join(data.roomId);
  });

  socket.on('group-call-user-left', (data) => {
    socket.leave(data.roomId);

    io.to(data.roomId).emit('group-call-user-left', {
      streamId: data.streamId
    });
  });

  socket.on('group-call-closed-by-host', (data) => {
    groupCallRooms = groupCallRooms.filter(room => room.peerId !== data.peerId);

    io.sockets.emit('broadcast', {
      event: broadcastEventTypes.GROUP_CALL_ROOMS,
      groupCallRooms
    });
  });

  socket.on("Input Chat Message", msg => {

    connect.then(db => {
      try {
          let chat = new Chat({ message: msg.chatMessage, sender:msg.userId, type: msg.type })

          chat.save((err, doc) => {
            console.log(doc)
            if(err) return res.json({ success: false, err })

            Chat.find({ "_id": doc._id })
            .populate("sender")
            .exec((err, doc)=> {

                return io.emit("Output Chat Message", doc);
            })
          })
      } catch (error) {
        console.error(error);
      }
    })
   })

})


//use this to show the image you have in node js server to client (react js)
//https://stackoverflow.com/questions/48914987/send-image-path-from-node-js-express-server-to-react-client
app.use('/uploads', express.static('uploads'));

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {

  // Set static folder
  app.use(express.static("client/build"));

  // index.html for all page routes
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const port = process.env.PORT || 5000

server.listen(port, () => {
  console.log(`Server Running at ${port}`)
});