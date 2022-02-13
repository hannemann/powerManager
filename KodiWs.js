import WebSocket from "websocket";

class KodiWS {
  constructor() {
    this.connectInterval = undefined;
    this.client = new WebSocket.client();
    this.callbacks = {};
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

  connectionHandler(connection) {
    clearInterval(this.connectInterval);
    this.connection = connection;
    this.connection.on("message", this.handleMessage);
    this.connection.on("error", this.handleError);
    this.connection.on("close", this.handleClosed);
    console.log("Websocket connected");
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

  get connected() {
    return typeof this.connection !== "undefined" && this.connection.connected;
  }
}
export { KodiWS };
