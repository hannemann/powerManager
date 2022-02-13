import WebSocket from "websocket";

class KodiWS {
  constructor() {
    this.connectInterval = undefined;
    this.client = new WebSocket.client();
    this.callbacks = {};
    this._requestId = 0;
  }

  init() {
    this.initListeners();
    this.initClient();
    this.connect();
  }

  initListeners() {
    this.handleConnection = this.connectionHandler.bind(this);
    this.handleConnectionFailed = this.connectFailedHandler.bind(this);
    this.handleMessage = this.messageHandler.bind(this);
    this.handleError = this.errorHandler.bind(this);
    this.handleClosed = this.closedHandler.bind(this);
    return this;
  }

  initClient() {
    this.client.on("connect", this.handleConnection);
    this.client.on("connectFailed", this.handleConnectionFailed);
  }

  connect() {
    this.connectInterval = setInterval(() => {
      console.log("Attempt to connect to Kodi websocket");
      this.client.connect(
        `ws://${process.env.ADDRESS}:${process.env.KODI_TCP_PORT}/jsonrpc`,
        ""
      );
    }, 1000);
  }

  async connectionHandler(connection) {
    clearInterval(this.connectInterval);
    this.connection = connection;
    this.connection.on("message", this.handleMessage);
    this.connection.on("error", this.handleError);
    this.connection.on("close", this.handleClosed);
    console.log("Websocket connected");

    try {
      const players = await this.activePlayers;
      console.log(players);
    } catch (error) {
      console.log(error);
    }
  }

  messageHandler(message) {
    if (message.type === "utf8") {
      console.log("Received: '" + message.utf8Data + "'");
      const result = JSON.parse(message.utf8Data);
      if (result.method && result.method.match(/[A-Z]+\.On/)) {
        const callback = result.method
          .split(".")
          .pop()
          .replace(/^On/, "")
          .toLowerCase();
        if (typeof this.callbacks[callback] === "function") {
          this.callbacks[callback](result);
        }
      }
      if (result.id && typeof this.callbacks[result.id] === "function") {
        if (result.result) {
          this.callbacks[result.id](result.result, null);
        }
        if (result.error) {
          this.callbacks[result.id](null, result.error);
        }
        delete this.callbacks[result.id];
      }
    }
  }

  errorHandler(error) {
    console.log("Error returned: %s", error.toString());
  }

  closedHandler() {
    delete this.connection;
    this.connect();
  }

  connectFailedHandler(error) {
    console.log(
      "Websocket connection to Kodi could not be established: %s",
      error.toString()
    );
  }

  on(event, callback) {
    if (typeof callback === "function") {
      this.callbacks[event] = callback;
    }
  }

  send(payload) {
    return new Promise((resolve, reject) => {
      if (!this.connected) reject("Not connected");
      this.callbacks[payload.id] = (result, error) => {
        result && resolve(result);
        error && reject(error);
      };
      this.connection.sendUTF(JSON.stringify(payload));
    });
  }

  get connected() {
    return typeof this.connection !== "undefined" && this.connection.connected;
  }

  get requestId() {
    this._requestId++;
    return this._requestId;
  }

  get activePlayers() {
    return this.send({
      jsonrpc: "2.0",
      id: this.requestId,
      method: "Player.GetActivePlayers",
    });
  }
}
export { KodiWS };
