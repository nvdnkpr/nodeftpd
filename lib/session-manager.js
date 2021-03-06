/**
 * Create a new FTP session and set the session defaults based on the current
 * server configuration.
 *
 * @return {Object}
 */
exports.startSession = function () {
  return {
    // Ip address the client is connected from
    clientIp: false,

    // Whether or not the user has sent a valid USER/PASS command
    authenticated: false,

    // User that the client authenticated as with the USER command
    user: '',

    // Current working directory
    cwd: '/',

    // Rename from (Used by RNFR command)
    rnfr: false,

    // Transfer type (See http://www.ietf.org/rfc/rfc959.txt,
    // REPRESENTATION TYPE)
    type: 'L8',

    // Transfer type
    binary: false,

    // Transfer type (human friendly label)
    transferType: 'ASCII',

    // Transfer mode (active or passive)
    mode: 'active',

    // Settings for active mode data connections
    activeMode: {
      clientIp: '',
      clientPort: 0
    },

    // Settings for passive mode data connections
    passiveMode: {
      port: 0
    },

    // Byte position to start STOR/RETV operations
    restByteCount: 0,

    // FTP parameters
    parameters: {
      UTF8: 'on'
    },

    // Chroot home
    chrootHome: '/',

    // Bytes transferred (via the data channel)
    bytesTransferred: 0,

    // Active data channel
    dataChannel: false,

    // Transfer mode (S => Stream, B => Block, C => Compressed)
    transferMode: 'S'
  };
};
