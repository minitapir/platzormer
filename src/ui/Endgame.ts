export default class Endgame extends Phaser.Scene {
  constructor() {
    super("endgame");
  }

  public preload = () => {
    this.load.image("background", "assets/images/tileset.png");
  };
  public create = () => {
    const { width, height } = this.scale;
    const bg = this.add.sprite(0, 0, "background");
    bg.setOrigin(0, 0);
  };
}
