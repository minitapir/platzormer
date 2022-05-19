import Phaser from "phaser";

export default class Demo extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload = (): void => {
    this.#preloadMapImages();
  };

  create = (): void => {
    this.#setupMap();
  };

  update() {}

  // Private fields

  /**
   * This method handles images loading at game creation.
   */
  #preloadMapImages = (): void => {
    this.load.image("background", "assets/images/background.png");
  };
  
  /**
   * This method handles background and map creation.
   */
  #setupMap = (): void => {
    // Add background to displayed images.
    this.add.image(0, 0, "background").setOrigin(0, 0).setScrollFactor(0, 0);
  };
}
