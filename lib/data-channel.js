// Third party dependencies
var net = require('net');

// Local dependencies
var config = require('./config');
var logger = require('./logger');

// Keep track of the channel
var channel;

/**
 * Create a data channel.
 * @param {!object} session
 * @param {!function} callback
 * @return {boolean}
 */
exports.create = function (session, callback) {
  if (session.mode === 'active') {
    channel = createActiveModeDataChannel(session, callback);
  } else if (session.mode === 'passive') {
    channel = createPassiveModeDataChannel(session, callback);
  } else {
    throw new Error('Data transfer mode is neither passive nor active');
  }

  return channel;
};

/**
 * Close the data channel.
 */
exports.close = function () {
  if (typeof channel.close !== 'undefined') {
    channel.close();
  } else if (typeof channel.end !== 'undefined') {
    channel.end();
  }
}

/**
 * Create a data channel for passive mode file transfers using a TCP server.
 * @param {!object} session
 * @param {!function} callback
 */
var createPassiveModeDataChannel = function (session, callback) {
  // Create a generic TCP/IP server
  var server = net.createServer(function (socket) {
    // Attempt to prevent PASV connection theft using PASV IP protected. We drop
    // the data connection if the IP address connected to the PASV port does not
    // match the client's IP address. This does not stop all attacks.
    if (session.clientIp !== socket.remoteAddress) {
      socket.end();
    }

    // Reference to this socket in the session
    session.dataChannel = socket;

    // Catch errors
    socket.on('error', function (err) {
      if (err.code !== 'ECONNRESET') {
        logger.log('error', 'Socket error in the data channel, err: ' + err);
      }
    });

    // Call the given callback function, and give it a callback function to
    // execute when IT is done to close down the server again.
    callback(socket, function() {
      // Update the bytes transferred
      session.bytesTransferred += socket.bytesRead + socket.bytesWritten;

      // No longer have a data channel
      session.dataChannel = false;

      // Close the socket & server
      socket.end();
      server.close();
    });
  });

  server.on('close', function () {
    process.send({ action: 'free_passive_port', port: session.passiveMode.port });
    session.passiveMode.port = 0;
  });

  // Don't start the server if the port is zero
  if (session.passiveMode.port !== 0) {
    server.listen(session.passiveMode.port, config.listen);
    return server;
  } else {
    return false;
  }
};

/**
 * Create a data channel for active mode file transfers using a TCP connection.
 * @param {!object} session
 * @param {!function} callback
 */
var createActiveModeDataChannel = function (session, callback) {
  // Don't start the connection if the port is zero
  if (session.activeMode.clientPort === 0) {
    return false;
  }

  // Open a TCP connection
  var client = net.connect(session.activeMode.clientPort, session.activeMode.clientIp, function () {
    // Reference to this socket in the session
    session.dataChannel = client;

    // Call the given callback function, and give it a callback function to
    // execute when IT is done to close down the server again.
    callback(client, function() {
      // Update the bytes transferred
      session.bytesTransferred += client.bytesRead + client.bytesWritten;

      // No longer have a data channel
      session.dataChannel = false;

      // Close the socket
      client.end();
    });
  });

  // Catch errors
  client.on('error', function (err) {
    if (err.code !== 'ECONNRESET') {
      logger.log('error', 'Socket error in the data channel, err: ' + err);
    }
  });

  // Close up loose ends
  client.on('close', function () {
    session.activeMode.clientIp = '';
    session.activeMode.clientPort = 0;
  });

  return client;
};
