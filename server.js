// server.js

const express = require('express');
const SocketServer = require('ws').Server;
const uuidv1 = require('uuid/v1');
const randomcolor = require('randomcolor');

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

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.

wss.on('connection', (ws) => {
  console.log('Client connected: ' + wss.clients.size)

  const clientID = uuidv1()

  clientHasConnected(ws, clientID)

  ws.on('message', function incoming(message) {
    let inMsg = JSON.parse(message)
    console.dir(inMsg)
    let outMsg

    switch (inMsg.type) {

      case "outMessage":
        outMsg = buildOutMessage(inMsg, 'inMessage')
        break;

      case "outNotification":
        outMsg = buildOutMessage(inMsg, 'inNotification')
    }

    wss.broadcast(outMsg)
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected: ' + wss.clients.size)
    clientHasDisconnected(clientID)
  });
});

// Helpers

wss.broadcast = function(data) {
  // Broadcast to everyone.
  wss.clients.forEach(function (client) {
    client.send(data);
  })
}

function buildOutMessage(inMsgJSON, type) {
  inMsgJSON['id'] = uuidv1()
  inMsgJSON['type'] = type
  return JSON.stringify(inMsgJSON)
}

function clientHasConnected(client, clientID) {

  clients[clientID] = {
    id: clientID,
    color: randomcolor({luminosity: 'bright'})
  }

  const setupMsg = {
    type: "inSetup",
    id: clientID,
    clientList: clients
  }

  const connectMsg = {
    type: "inConnect",
    numUsers: wss.clients.size,
    user: clients[clientID]
  }

  client.send(JSON.stringify(setupMsg))
  wss.broadcast(JSON.stringify(connectMsg))
}

function clientHasDisconnected(clientID) {
  // handle race condition
  const client = clients[clientID]
  if (!client) return

  const disconnectMsg = {
    type: 'inDisconnect',
    numUsers: wss.clients.size,
    user: client
  }

  wss.broadcast(JSON.stringify(disconnectMsg))
  delete clients[clientID]
}