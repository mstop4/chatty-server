// server.js

require('dotenv-safe').load()
const express = require('express')
const SocketServer = require('ws').Server
const uuidv1 = require('uuid/v1')

// Set the host and port according to env file
const HOST = process.env.SERVER_HOST
const PORT = process.env.SERVER_PORT

// Create a new express server
const server = express()

 // Make the express server serve static assets (html, javascript, css) from the /public folder
.use(express.static('public'))
.listen(PORT, HOST, () => console.log(`Running at ${HOST}:${PORT}`))

// Create the WebSockets server
const wss = new SocketServer({ server })

// List of all clients connected to server
const clients = {}

// Add connection helpers
const ch = require('./modules/connectHelpers.js')(wss, clients)

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.

wss.on('connection', (ws) => {
  const clientID = uuidv1()
  console.log(`Client ${clientID} connected. ${wss.clients.size} clients online.`)

  ch.clientHasConnected(ws, clientID)

  ws.on('message', function incoming(message) {
    let inMsg = JSON.parse(message)
    let outMsg

    switch (inMsg.type) {

      case "outMessage":
        outMsg = ch.buildMessage(inMsg, 'inMessage')
        break

      case "outNotification":
        outMsg = ch.buildMessage(inMsg, 'inNotification')
    }

    wss.broadcast(outMsg)
  })

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log(`Client ${clientID} disconnected. ${wss.clients.size} clients online.`)
    ch.clientHasDisconnected(clientID)
  })
})