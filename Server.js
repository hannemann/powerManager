var http = require('http'),
    Gembird = require('./Gembird.js'),
    Squeeze = require('./Squeeze.js'),
    Kodi = require('./Kodi.js'),
    Syslogger = require('ain2'),
    server;

Server = function () {};

Server.prototype.init = function () {
  console.log('===== Initializing Powermanager =====');
  console.log('Address: %s', process.env.ADDRESS);
  console.log('Port: %s', process.env.PORT);
  this.server = http.createServer();
  this.server.listen(parseInt(process.env.PORT, 10), process.env.ADDRESS);
  this.server.on('request', this.handleRequest.bind(this));
  this.gembird = new Gembird.Gembird();
  this.squeeze = new Squeeze.Squeeze();
  this.squeeze.init();
  this.kodi = new Kodi.Kodi();
  this.kodi.init();
  this.plugSpeaker = 3;
  this.plugMonitor = 4;
  console.log('Powermanager initialized');
};

Server.prototype.handleRequest = function (request, response) {

  response.writeHead(200, {"Content-Type": "text/html"});
  if (0 === request.url.indexOf('/startMusic')) {
    console.log('Start Music');
    console.log('activating speaker socket');
    this.gembird.switch(this.plugSpeaker, true);
    console.log('deactivating monitor socket');
    this.gembird.switch(this.plugMonitor, false);
    this.kodi.stopActivePlayers();
  }

  if (0 === request.url.indexOf('/stopMusic')) {
    console.log('Stop Music');
    this.kodi.isActive(function (state) {
      console.log('Kodi screensaver  is ' + (state ? 'not active' : 'active'));
      if (!state) {
        console.log('deactivating speaker socket');
        this.gembird.switch(this.plugSpeaker, false);
      }
    }.bind(this));
  }

  if (0 === request.url.indexOf('/startWatching')) {
    console.log('Kodi screensaver deactivated');
    console.log('activating monitor socket');
    this.gembird.switch(this.plugMonitor, true);
    console.log('activating speaker socket');
    this.gembird.switch(this.plugSpeaker, true);
    console.log('stopping squeezelite');
    this.squeeze.stop();
  }

  if (0 === request.url.indexOf('/stopWatching')) {
    console.log('Kodi screensaver activated');
    this.gembird.switch(this.plugMonitor, false);
    console.log('deactivating monitor socket');
    this.squeeze.isPlaying(function (state) {
      console.log('squeezelite is ' + (state ? 'playing' : 'not playing'));
      if (!state) {
        console.log('deactivating speaker socket');
        this.gembird.switch(this.plugSpeaker, false);
      }
    }.bind(this));
  }
  response.end();
};

server = new Server();
server.init();
