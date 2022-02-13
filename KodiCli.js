import child_process from "child_process";

class KodiCli {
  constructor() {
    this.bin = "kodi-send";
  }

  init() {
    console.log("KodiCli module initialized");
  }

  activateScreenSaver() {
    const command = [this.bin, '--action="ActivateScreensaver"'];
    child_process.exec(command.join(" "));
  }
}

export { KodiCli };
