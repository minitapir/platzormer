import Phaser from "phaser";
import config from "./config";
import Level1 from "./levels/Level1";
import Level2 from "./levels/Level2";
import Endgame from "./ui/Endgame";
import Home from "./ui/Home";
import UI from "./ui/UI";

new Phaser.Game(
  Object.assign(config, {
    scene: [Home, Level1, Level2, Endgame, UI],
  })
);
