import { GameObjects } from "phaser";

export default class UI extends Phaser.Scene {
  public chronoEvent!: Phaser.Time.TimerEvent;
  public static chrono: number = 0;
  public defaultChronoText: string;
  public currentChronoText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "ui", active: true });
    this.defaultChronoText = "Chrono : ";
  }

  public create = () => {
    this.currentChronoText = this.add.text(10, 10, "Chrono : ", {
      font: "30px Orbitron",
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
    });

    this.chronoEvent = this.time.addEvent({
      delay: 100,
      callback: () => {
        UI.chrono += 100;
        this.currentChronoText.setText(
          this.defaultChronoText + UI.chrono / 1000
        );
      },
      callbackScope: this,
      loop: true,
    });
  };

  public update(time: number, delta: number): void {}

  public stopChrono = () => {
    this.time.paused = true;
  };
}
