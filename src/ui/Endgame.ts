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

    const chronoText = this.add.text(
      width / 2,
      height / 2.1,
      (this.scene.get("ui") as UI).chrono.toString(),
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
}
