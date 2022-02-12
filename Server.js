var http = require("http"),
  Gembird = require("./Gembird.js"),
  Squeeze = require("./Squeeze.js"),
  Kodi = require("./Kodi.js"),
  Syslogger = require("ain2"),
  server;

Server = function () {};

Server.prototype.init = function () {
  console.log("===== Initializing Powermanager =====");
  console.log("Address: %s", process.env.ADDRESS);
  console.log("Port: %s", process.env.PORT);
  this.server = http.createServer();
  this.server.listen(parseInt(process.env.PORT, 10), process.env.ADDRESS);
  this.server.on("request", this.handleRequest.bind(this));
  this.gembird = new Gembird.Gembird();
  this.squeeze = new Squeeze.Squeeze();
  this.squeeze.init();
  this.kodi = new Kodi.Kodi();
  this.kodi.init();
  this.plugSpeaker = 3;
  this.plugMonitor = 4;
  this.pollKodiScreensaver();
  console.log("Powermanager initialized");
};

Server.prototype.pollKodiScreensaver = function () {
  setInterval(
    function () {
      this.kodi.isActive(
        function (active) {
          if ("undefined" === typeof this.kodiActive) {
            this.kodiActive = active;
          } else {
            console.log(
              "Kodi screensaver  is " + (active ? "not active" : "active")
            );
            if (active !== this.kodiActive) {
              console.log("Kodi screensaver state changed");
              this.kodiActive = active;
              if (active) {
                this.startWatching();
              } else {
                this.stopWatching();
              }
            }
          }
        }.bind(this)
      );
    }.bind(this),
    5000
  );
};

Server.prototype.handleRequest = function (request, response) {
  response.writeHead(200, { "Content-Type": "text/html" });
  if (0 === request.url.indexOf("/startMusic")) {
    this.startMusic();
  }

  if (0 === request.url.indexOf("/stopMusic")) {
    this.stopMusic();
  }

  if (0 === request.url.indexOf("/startWatching")) {
    this.startWatching();
  }

  if (0 === request.url.indexOf("/stopWatching")) {
    this.stopWatching();
  }
  response.end();
};

Server.prototype.startMusic = function () {
  console.log("Start Music");
  console.log("activating speaker socket");
  this.gembird.switch(this.plugSpeaker, true);
  console.log("deactivating monitor socket");
  this.gembird.switch(this.plugMonitor, false);
  console.log("stopping active kodi players");
  this.kodi.stopActivePlayers();
};

Server.prototype.stopMusic = function () {
  console.log("Stop Music");
  this.kodi.isActive(
    function (active) {
      console.log("Kodi screensaver  is " + (active ? "not active" : "active"));
      if (!active) {
        console.log("deactivating speaker socket");
        this.gembird.switch(this.plugSpeaker, false);
      }
    }.bind(this)
  );
};

Server.prototype.startWatching = function () {
  console.log("Kodi screensaver deactivated");
  console.log("activating monitor socket");
  this.gembird.switch(this.plugMonitor, true);
  console.log("activating speaker socket");
  this.gembird.switch(this.plugSpeaker, true);
  console.log("stopping squeezelite");
  this.squeeze.stop();
};

Server.prototype.stopWatching = function () {
  console.log("Kodi screensaver activated");
  this.gembird.switch(this.plugMonitor, false);
  console.log("deactivating monitor socket");
  this.squeeze.isPlaying((playing) => {
    console.log("squeezelite is " + (playing ? "playing" : "not playing"));
    if (!playing) {
      console.log("deactivating speaker socket");
      this.gembird.switch(this.plugSpeaker, false);
    }
  });
};

server = new Server();
server.init();
