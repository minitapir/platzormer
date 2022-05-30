import UI from "./UI";

export default class Endgame extends Phaser.Scene {
  constructor() {
    super("endgame");
  }

  public preload = () => {
    this.load.image("endgameBackground", "assets/images/UI/end.png");
  };
  public create = () => {
    const { width, height } = this.scale;
    const bg = this.add.sprite(0, 0, "endgameBackground");
    bg.setOrigin(0, 0);
    bg.setDisplaySize(width, height);

    const timer = (this.scene.get("ui") as UI).chrono;
    const chronoText = this.add.text(
      width / 2,
      height / 2.2,
      this.millisToMinutesAndSeconds(timer),
      {
        font: "50px Orbitron",
        padding: {
          right: 10,
        },
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#097A70",
          stroke: true,
          fill: true,
        },
      }
    );

    chronoText.setOrigin(0.5, 1);
  };

  public millisToMinutesAndSeconds = (millis: number) => {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    //ES6 interpolated literals/template literals
    //If seconds is less than 10 put a zero in front.
    return `${minutes}:${+seconds < 10 ? "0" : ""}${seconds}`;
  };
}
