export default class UI extends Phaser.Scene {
  public chronoEvent!: Phaser.Time.TimerEvent;
  public chrono: number;
  public defaultChronoText: string;
  public currentChronoText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "ui", active: true });
    this.chrono = 0;
    this.defaultChronoText = "Chrono : ";
  }

  public create = () => {
    this.currentChronoText = this.add.text(
      10,
      this.game.canvas.height - 50,
      "hey",
      {
        font: "48px Arial",
        fill: "#000000",
      }
    );

    this.chronoEvent = this.time.addEvent({
      delay: 100,
      callback: () => {
        this.chrono += 100;
        this.currentChronoText.setText(
          this.defaultChronoText + this.chrono / 1000
        );
      },
      callbackScope: this,
      loop: true,
    });
    this.events.addListener("respawn", () => {
      this.chrono = 0;
    });
  };

  public update(time: number, delta: number): void {}
}
