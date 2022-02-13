import http from "http";
import { Gembird } from "./Gembird.js";
import { Squeeze } from "./Squeeze.js";
import { KodiCli } from "./KodiCli.js";
import { KodiWS } from "./KodiWs.js";

class Server {
  constructor() {
    this.gembird = new Gembird();
    this.squeeze = new Squeeze();
    this.kodiWs = new KodiWS();
    this.kodiCli = new KodiCli();
    this.plugSpeaker = 3;
    this.plugMonitor = 4;
  }

  init() {
    console.log("===== Initializing Powermanager =====");
    console.log("Address: %s", process.env.ADDRESS);
    console.log("Port: %s", process.env.PORT);
    this.server = http.createServer();
    this.server.listen(parseInt(process.env.PORT, 10), process.env.ADDRESS);
    this.server.on("request", this.handleRequest.bind(this));
    this.squeeze.init();
    this.kodiCli.init();
    this.kodiWs.init();

    this.kodiWs.on("screensaveractivated", this.stopWatching.bind(this));
    this.kodiWs.on("screensaverdeactivated", this.startWatching.bind(this));

    console.log("Powermanager initialized");
  }

  handleRequest(request, response) {
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
  }

  async startMusic() {
    console.log("Start Music");
    console.log("activating speaker socket");
    this.gembird.switch(this.plugSpeaker, true);
    console.log("stopping active kodi players");
    try {
      const players = await this.kodiWs.activePlayers;
      players.forEach(async (player) => {
        const result = await this.kodiWs.stopPlayer(player.playerid);
      });
      const result = await this.kodiWs.screensaverActive;
      result["System.ScreenSaverActive"] || this.kodiCli.activateScreenSaver();
    } catch (error) {
      console.log(error);
    }
  }

  async stopMusic() {
    console.log("Stop Music");
    try {
      const result = await this.kodiWs.screensaverActive;
      console.log(
        `Kodi screensaver is ${
          result["System.ScreenSaverActive"] ? "active" : "not active"
        }`
      );
      if (result["System.ScreenSaverActive"]) {
        console.log("deactivating speaker socket");
        this.gembird.switch(this.plugSpeaker, false);
      }
    } catch (error) {
      console.log(error);
    }
  }

  startWatching() {
    console.log("Kodi screensaver deactivated");
    console.log("activating monitor socket");
    this.gembird.switch(this.plugMonitor, true);
    console.log("activating speaker socket");
    this.gembird.switch(this.plugSpeaker, true);
    console.log("stopping squeezelite");
    this.squeeze.stop();
  }

  stopWatching() {
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
  }
}

new Server().init();
