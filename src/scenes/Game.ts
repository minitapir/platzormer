import Phaser, { Tilemaps } from "phaser";

export default class Demo extends Phaser.Scene {
  map : any;
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
    this.load.tilemapTiledJSON("map", "assets/images/tilemapTiled.json");
    this.load.image("background", "assets/images/background.png");
    this.load.image('tiles', 'assets/images/tileset.png');
  };

  /**
   * This method handles background and map creation.
   */
  #setupMap = (): void => {
    // Add background to displayed images.
    this.add.image(0, 0, "background").setOrigin(0, 0).setScrollFactor(0, 0);
    this.map = this.make.tilemap({key:'map'}) as Tilemaps.Tilemap;
    let tileset = this.map.addTilesetImage('tilesetTest', 'tiles');
    let platforms = this.map.createLayer('plateformes', tileset, 0,0);
    platforms.setCollisionByExclusion(-1,true);
  };
}
