import Level1 from "../levels/Level1";
import UI from "./UI";

export default class Home extends Phaser.Scene {
  private enter!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("home");
  }

  public preload = () => {
    this.load.image("homeBackground", "assets/images/UI/splash_empty.png");
    this.load.audio("boucle_menu", "assets/music/boucle_menu.mp3");
  };
  public create = () => {
    const { width, height } = this.scale;
    // Music
    if (this.sound.getAll("boucle_menu").length === 0) {
      this.sound.add("boucle_menu").setLoop(true).setVolume(0.1).play();
    }

    const bg = this.add.sprite(0, 0, "homeBackground").setOrigin(0, 0);
    bg.setDisplaySize(width, height);

    const title = this.add.text(width / 2, height / 2, "Lost", {
      font: "60px Arial",
      padding: {
        right: 10,
      },
      color: "white",
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: "#097A70",
        stroke: true,
        fill: true,
      },
    });

    title.setOrigin(0.5, 0.5);

    const pressButton = this.add.text(
      width / 2,
      height / 1.1,
      "Press Enter to begin",
      {
        font: "60px Arial",
        padding: {
          right: 10,
        },
        color: "#097A70",
      }
    );
    pressButton.setAlpha(0.1);

    pressButton.setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: pressButton,
      alpha: 1,
      ease: "Power2",
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
    this.enter = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );
  };

  public update(time: number, delta: number): void {
    if (this.enter.isDown && this.input.keyboard.checkDown(this.enter, 100)) {
      this.scene.start("Level1");
      this.sound.get("boucle_menu").stop();
    }
  }
}
