
const createPeerServerListeners = (PeerServer) => {
    PeerServer.on('connection', (client) => {
        console.log('succesfully connector to peer js server')
        console.log(client.id)
    })
}

module.exports = {
    createPeerServerListeners
}
;