// connectionHelpers.js
//
// Various helper functions for the server

const randomcolor = require('randomcolor')
const uuidv1 = require('uuid/v1')

module.exports = function connectHelpers (wss, clients) {

  // Broadcast to everyone
  wss.broadcast = function(data) {
    wss.clients.forEach(function (client) {
      client.send(data)
    })
  }

  return {

    // Constructs client-bound messages in a specific format
    buildMessage: (inMsgJSON, type) => {

      inMsgJSON['id'] = uuidv1()
      inMsgJSON['type'] = type

      // Determine if the message conent has a /youtube command.

      let youtubeMatch = inMsgJSON['content'].match(/^\/youtube (.+)/)

      if (youtubeMatch) {
        inMsgJSON['contentType'] = 'media'
        inMsgJSON['content'] = `<iframe width="560" height="315" src="https:\/\/www.youtube.com/embed/${youtubeMatch[1]}" frameborder="0" allowfullscreen></iframe>`
      } else {

        // Determine if the message content is an image URL. Detects different URL formats, e.g:
        //
        // https://www.example.com/test.png
        // http://example.com/test.png
        // www.example.com/test.png
        // example.com/test.png

        // Results: [full match, extension, index, original input]
        let imgMatch = inMsgJSON['content'].match(/^.+\/.+\.(png|gif|jpg|jpeg|bmp)$/i)

        if (imgMatch) {
          inMsgJSON['contentType'] = 'media'
          inMsgJSON['content'] = `<img class="message-image" src="${imgMatch[0]}"/>`
          //inMsgJSON['content'] = `<iframe width="560" height="315" src="https:\/\/www.youtube.com/embed/C_RBOkFPoic" frameborder="0" allowfullscreen></iframe>`
        } else {
          inMsgJSON['contentType'] = 'text'
        }
      }
      return JSON.stringify(inMsgJSON)
    },

    clientHasConnected: (client, clientID) => {

      clients[clientID] = {
        id: clientID,
        color: randomcolor({seed: clientID, luminosity: 'bright'})
      }

      // Sets up new client with a list of all existing clients
      const setupMsg = {
        type: "inSetup",
        id: clientID,
        clientList: clients
      }

      // Tells all other clients to add the new client to their list
      const connectMsg = {
        type: "inConnect",
        numUsers: wss.clients.size,
        user: clients[clientID]
      }

      client.send(JSON.stringify(setupMsg))
      wss.broadcast(JSON.stringify(connectMsg))
    },

    clientHasDisconnected: (clientID) => {

      // handle race condition, in case client disconnects before
      // the server has added them to the client list
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
  }
}