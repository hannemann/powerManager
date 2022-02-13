import WebSocket from "websocket";

const client = new WebSocket.client();

client.on("connectFailed", (error) =>
  console.log("WS Connection Error %s", error.toString())
);

client.on("connect", (con) => {
  console.log("Websocket conneted");
});

export default client;
