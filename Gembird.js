import child_process from "child_process";

var Gembird = function () {};

Gembird.prototype.command = "sispmctl";

Gembird.prototype.argOn = "-o";

Gembird.prototype.argOff = "-f";

Gembird.prototype.argStatus = "-g";

Gembird.prototype.switch = function (socket, status) {
  var command = [this.command, status ? this.argOn : this.argOff, socket];

  this.getStatus(socket);

  setTimeout(
    function () {
      child_process.exec(command.join(" "), this.handleResponse.bind(this));
    }.bind(this),
    1000
  );
};

Gembird.prototype.getStatus = function (socket) {
  var command = [this.command, this.argStatus, socket];

  child_process.exec(command.join(" "), this.handleResponse.bind(this));
};

Gembird.prototype.handleResponse = function (error, stdout, stderr) {
  if (error) {
    console.log(stderr);
  }
  console.log(stdout);
};

export { Gembird };
