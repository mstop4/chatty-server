// server.js

const express = require('express');
const SocketServer = require('ws').Server;
const uuidv1 = require('uuid/v1');

// Set the port to 3003
const PORT = 3003;

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
  updateAllUserCounts();

  ws.on('message', function incoming(message) {
    let inMsg = JSON.parse(message)
    let outMsg

    switch (inMsg.type) {

      case "outMessage":
        outMsg = buildOutMessage(inMsg, 'inMessage')
        break;

      case "outNotification":
        outMsg = buildOutMessage(inMsg, 'inNotification')
    }

    // Broadcast to everyone.
    wss.clients.forEach(function each(client) {
      client.send(outMsg);
    })
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected: ' + wss.clients.size)
    updateAllUserCounts();
  });
});

// Helpers
function updateAllUserCounts() {
  const outMsg = JSON.stringify({value: wss.clients.size, type: "inUserUpdate"})

  // Broadcast to everyone.
  wss.clients.forEach(function each(client) {
      client.send(outMsg);
  })
}

function buildOutMessage(inMsgJSON, type) {
  inMsgJSON['id'] = uuidv1()
  inMsgJSON['type'] = type
  return JSON.stringify(inMsgJSON)
}

// function clientConnected(client, clientID) {

//   clients[clientID] = {
//     color: #0000FF
//   }

// }