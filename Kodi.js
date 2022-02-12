var http = require("http");

var Kodi = function () {
  this.requestId = 1;
  this.callbacks = {};
  this.requests = {};
};

Kodi.prototype.isActiveData = {
  jsonrpc: "2.0",
  id: 1,
  method: "XBMC.GetInfoBooleans",
  params: {
    booleans: ["System.ScreenSaverActive"],
  },
};

Kodi.prototype.getActivePlayerData = {
  jsonrpc: "2.0",
  id: 1,
  method: "Player.GetActivePlayers",
};

Kodi.prototype.stopData = {
  jsonrpc: "2.0",
  id: 1,
  method: "Player.Stop",
  params: {
    playerid: 1,
  },
};

Kodi.prototype.activateScreensaverData = {
  jsonrpc: "2.0",
  method: "GUI.ActivateWindow",
  id: 1,
  params: {
    window: "screensaver",
  },
};

Kodi.prototype.options = {
  hostname: process.env.ADDRESS,
  port: process.env.KODI_PORT,
  path: "/jsonrpc",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

Kodi.prototype.init = function () {
  this.responseHandler = this.handleResponse.bind(this);
  this.errorHandler = this.handleError.bind(this);
  console.log("Kodi module initialized");
};

Kodi.prototype.getClient = function () {
  if ("undefined" !== typeof this.client) {
    this.removeObserver();
  }
  this.request = http.request(this.options, this.handleRequest.bind(this));
  this.addObserver();
};

Kodi.prototype.addObserver = function () {
  this.request.on("error", this.handleError.bind(this));
};

Kodi.prototype.removeObserver = function () {
  this.request.removeListener("data", this.responseHandler);
  this.request.removeListener("error", this.errorHandler);
};

Kodi.prototype.handleError = function (e) {
  console.log("Kodi: problem with request: " + e.message);
};

Kodi.prototype.handleRequest = function (result) {
  result.setEncoding("utf8");
  result.on("data", this.handleResponse.bind(this));
};

Kodi.prototype.handleResponse = function (response) {
  var status;

  response = JSON.parse(response);

  if (response.error) {
    console.log(response.error);
  } else {
    const id = response.id.toString();
    switch (this.requests[id]) {
      case "isActive":
        response = !response.result["System.ScreenSaverActive"];
        break;
      case "hasActivePlayer":
        response = response.length === 0 ? false : response;
        break;
      case "stop":
        break;
      case "activateScreenSaver":
        break;
    }
    if ("function" === typeof this.callbacks[id]) {
      this.callbacks[id](response);
      delete this.callbacks[id];
    }
  }
};

Kodi.prototype.isActive = function (callback) {
  this.getClient();

  const requestData = this.isActiveData;
  requestData.id = this.requestId;
  if ("function" === typeof callback) {
    this.callbacks[this.requestId] = callback;
  }
  this.requests[this.requestId] = "isActive";
  this.requestId++;

  this.request.write(JSON.stringify(this.isActiveData));
  this.request.end();
};

Kodi.prototype.hasActivePlayer = function (callback) {
  this.getClient();

  const requestData = this.getActivePlayerData;
  requestData.id = this.requestId;
  if ("function" === typeof callback) {
    this.callbacks[this.requestId] = callback;
  }
  this.requests[this.requestId] = "hasActivePlayer";
  this.requestId++;

  this.request.write(JSON.stringify(requestData));
  this.request.end();
};

Kodi.prototype.stop = function (id, callback) {
  this.getClient();

  const requestData = this.stopData;
  requestData.id = this.requestId;
  if ("function" === typeof callback) {
    this.callbacks[this.requestId] = callback;
  }
  this.requests[this.requestId] = "stop";
  this.requestId++;

  requestData.params.playerid = id;
  this.request.write(JSON.stringify(requestData));
  this.request.end();
};

Kodi.prototype.stopActivePlayers = function (callback) {
  this.hasActivePlayer(
    function (e) {
      if (e.result && e.result.length > 0) {
        setTimeout(
          function () {
            e.result.forEach(
              function (player, k) {
                const cb = k === e.result.length - 1 ? callback : undefined;
                this.stop(player.playerid, cb);
              }.bind(this)
            );
          }.bind(this),
          1000
        );
      }
    }.bind(this)
  );
};

/**
 * seems not to work?
 * @param {Function} callback
 */
Kodi.prototype.activateScreenSaver = function (callback) {
  this.getClient();

  const requestData = this.activateScreensaverData;
  requestData.id = this.requestId;
  if ("function" === typeof callback) {
    this.callbacks[this.requestId] = callback;
  }
  this.requests[this.requestId] = "activateScreenSaver";
  this.requestId++;

  this.request.write(JSON.stringify(requestData));
  this.request.end();
};

module.exports.Kodi = Kodi;
