var exec = require('child_process').exec;

var Gembird = function () {};

Gembird.prototype.command = 'sispmctl';

Gembird.prototype.argOn = '-o';

Gembird.prototype.argOff = '-f';

Gembird.prototype.argStatus = '-g';

Gembird.prototype.switch = function (socket, status) {

  var command = [
    this.command,
    status ? this.argOn : this.argOff,
    socket
  ];

  this.getStatus(socket);

  setTimeout(function () {
    exec(command.join(' '), this.handleResponse.bind(this));
  }.bind(this), 1000);
};

Gembird.prototype.getStatus = function (socket) {

  var command = [
    this.command,
    this.argStatus,
    socket
  ];

  exec(command.join(' '), this.handleResponse.bind(this));
};

Gembird.prototype.handleResponse = function (error, stdout, stderr) {

  if (error) {
    console.log(stderr);
  }
  console.log(stdout);
};

module.exports.Gembird = Gembird;
