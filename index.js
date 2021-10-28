const express = require("express");
const app = express();

const server = require("http").createServer(app);
const config = require("./middleware/config/key");

const mongoose = require("mongoose");
const connect = mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

app.use("/", (req, res) => {
    res.send("Hello")
})

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