var net = require('net');

var Squeeze = function () {};

Squeeze.prototype.init = function () {
  this.server = {
    "host" : process.env.LMS_ADDRESS,
    "port" : process.env.LMS_PORT
  },
  this.hmac = process.env.PLAYER_ID; // @see LMS -> Settings -> Player -> MAC Address
  this.dataHandler = this.handleData.bind(this);
  this.errorHandler = this.handleError.bind(this);
  this.callback = null;
  console.log('Squeeze module initialized');
};

Squeeze.prototype.getClient = function () {

  if ("undefined" !== typeof this.client) {
    this.removeObserver();
  }
  this.client = new net.Socket();
  this.addObserver();
};

Squeeze.prototype.addObserver = function () {

  this.client.on('data', this.dataHandler);
  this.client.on('error', this.errorHandler);
};

Squeeze.prototype.removeObserver = function () {

  this.client.removeListener('data', this.dataHandler);
  this.client.removeListener('error', this.errorHandler);
};

Squeeze.prototype.handleData = function (data) {

  var mode, state;
  data = data.toString('utf8');
  console.log('Squeeze: received data: ' + data);

  if (data.indexOf('mode') > -1) {
    mode = data.split(' ')[2].replace(/[^a-z]/, '');
    console.log('"' + mode + '"');
    switch (mode) {
      case 'stop':
      case 'pause':
        state = false;
        break;
      case 'play':
        state = true;
        break;

      default:
      break;
    }

    if ("function" === typeof this.callback) {
      this.callback(state);
      this.callback = null;
    }
  }

  this.client.destroy();
};

Squeeze.prototype.handleError = function(err) {
  console.log('error:', err.message);

  this.client.destroy();
};

Squeeze.prototype.isPlaying = function (callback) {

  this.getClient();

  if ("function" === typeof callback) {
    this.callback = callback;
  }
  this.client.connect(this.server.port, this.server.host, function () {
    this.client.write(this.hmac + " mode ?\nexit\n")
  }.bind(this));
};

Squeeze.prototype.stop = function (callback) {

  this.getClient();

  this.client.connect(this.server.port, this.server.host, function () {
    this.client.write(this.hmac + " stop\nexit\n")
  }.bind(this));
};

module.exports.Squeeze = Squeeze;
