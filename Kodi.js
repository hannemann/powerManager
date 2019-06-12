var http = require('http');

var Kodi = function () {};

Kodi.prototype.isActiveData = {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "XBMC.GetInfoBooleans",
  "params": {
    "booleans": [
      "System.ScreenSaverActive"
    ]
  }
};

Kodi.prototype.getActivePlayerData = {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "Player.GetActivePlayers"
};

Kodi.prototype.stopData =  {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "Player.Stop",
  "params": {
    "playerid": 1
  }
};

Kodi.prototype.options = {
  "hostname" : process.env.ADDRESS,
  "port" : process.env.KODI_PORT,
  "path" : "/jsonrpc",
  "method" : "POST",
  "headers" : {
    "Content-Type": "application/json"
  }
};

Kodi.prototype.init = function () {
  this.responseHandler = this.handleResponse.bind(this);
  this.errorHandler = this.handleError.bind(this);
  console.log('Kodi module initialized');
};

Kodi.prototype.getClient = function () {

  if ("undefined" !== typeof this.client) {
    this.removeObserver();
  }
  this.request = http.request(this.options, this.handleRequest.bind(this));
  this.addObserver();
};

Kodi.prototype.addObserver = function () {

  this.request.on('error', this.handleError.bind(this));
};

Kodi.prototype.removeObserver = function () {

    this.request.removeListener('data', this.responseHandler);
    this.request.removeListener('error', this.errorHandler);
};

Kodi.prototype.handleError = function (e) {
  console.log('Kodi: problem with request: ' + e.message);
};

Kodi.prototype.handleRequest = function (result) {

  result.setEncoding('utf8');
  result.on('data', this.handleResponse.bind(this));
};

Kodi.prototype.handleResponse = function (response) {

  var status;

  response = JSON.parse(response);

  if (response.error) {
    console.log(response.error);
  } else {

    if (response.result && response.result['System.ScreenSaverActive']) {
      response = !(response.result['System.ScreenSaverActive']);
    }
    if ("function" === typeof this.callback) {
      this.callback(response);
      this.callback = null;
    }
  }
};

Kodi.prototype.isActive = function (callback) {

  this.getClient();

  if ("function" === typeof callback) {
    this.callback = callback;
  }

  console.log(JSON.stringify(this.isActiveData));

  this.request.write(JSON.stringify(this.isActiveData));
  this.request.end();
};

Kodi.prototype.hasActivePlayer = function (callback) {

  this.getClient();

  if ("function" === typeof callback) {
    this.callback = callback;
  }

  this.request.write(JSON.stringify(this.getActivePlayerData));
  this.request.end();
};

Kodi.prototype.stop = function (id, callback) {

  this.getClient();

  if ("function" === typeof callback) {
    this.callback = callback;
  }
  this.stopData.params.playerid = id;
  this.request.write(JSON.stringify(this.stopData));
  this.request.end();
};

Kodi.prototype.stopActivePlayers = function (callback) {

  this.hasActivePlayer(function (e) {
    if (e.result && e.result.length > 0) {
      setTimeout(function () {
        e.result.forEach(function (player) {
          this.stop(player.playerid);
        }.bind(this));
      }.bind(this), 1000);
    }
  }.bind(this));
};

module.exports.Kodi = Kodi;
