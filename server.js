// server.js

const express = require('express');
const SocketServer = require('ws').Server;
const uuidv1 = require('uuid/v1');

// Set the port to 3003
const PORT = 3003;

const clients = {};

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

const ch = require('./modules/connectHelpers.js')(wss, clients)

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.

wss.on('connection', (ws) => {
  const clientID = uuidv1()
  console.log(`Client ${clientID} connecteddsjfldflkdsklfjlkfdj. ${wss.clients.size} clients online.`)

  ch.clientHasConnected(ws, clientID)

  ws.on('message', function incoming(message) {
    let inMsg = JSON.parse(message)
    let outMsg

    switch (inMsg.type) {

      case "outMessage":
        outMsg = ch.buildMessage(inMsg, 'inMessage')
        break;

      case "outNotification":
        outMsg = ch.buildMessage(inMsg, 'inNotification')
    }

    wss.broadcast(outMsg)
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log(`Client ${clientID} disconnected. ${wss.clients.size} clients online.`)
    ch.clientHasDisconnected(clientID)
  });
});

// Helpers

wss.broadcast = function(data) {
  // Broadcast to everyone.
  wss.clients.forEach(function (client) {
    client.send(data)
  })
}