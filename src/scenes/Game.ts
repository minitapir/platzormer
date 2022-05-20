import Phaser, { Tilemaps } from "phaser";

export default class Demo extends Phaser.Scene {
  private map: Tilemaps.Tilemap | undefined;

  constructor() {
    super("GameScene");
  }

  preload = (): void => {
    this.#preloadMapImages();
  };

  create = (): void => {
    let colliders = this.#setupMap();
    let player = this.#setupPlayer(colliders);
    this.#setupCamera(player);
  };

  update() {}

  // Private fields

  /**
   * This method handles images loading at game creation.
   */
  #preloadMapImages = (): void => {
    this.load.tilemapTiledJSON("map", "assets/images/map1.json");
    this.load.image("background", "assets/images/background.png");
    this.load.image("tiles", "assets/images/tileset.png");
    this.load.spritesheet("player", "assets/images/charac.png", {
      frameWidth: 32,
      frameHeight: 64,
    });
  };

  /**
   * This method handles background and map creation.
   */
  #setupMap = (): Tilemaps.TilemapLayer[] => {
    let colliders = [];
    this.add.image(0, 0, "background").setOrigin(0, 0).setScrollFactor(0, 0);
    this.map = this.make.tilemap({ key: "map" }) as Tilemaps.Tilemap;
    let tileset = this.map.addTilesetImage("tileset", "tiles");

    const ground = this.map.createLayer("ground", tileset);
    ground.setCollisionByExclusion([-1]);

    const wall = this.map.createLayer("wall", tileset);
    wall.setCollisionByExclusion([-1]);
    colliders.push(ground);
    colliders.push(wall);
    return colliders;
  };

  #setupPlayer = (
    colliders: Tilemaps.TilemapLayer[]
  ): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody => {
    let player = this.physics.add.sprite(64, 4000, "player").setOrigin(0, 0);

    // Colliders
    colliders.forEach((collider) =>
      this.physics.add.collider(player, collider)
    );

    // Animations
    const characters = ["yellow", "purple", "blue"];
    characters.forEach((character, index) =>
      this.anims.create({
        key: character,
        frames: [{ key: "player", frame: index }],
        frameRate: 20,
      })
    );

    return player;
  };

  #setupCamera = (
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ): void => {
    let cam = this.cameras.main.setBounds(0, 0, 1920, 4460);
    //cam.setZoom(1.5);
    cam.startFollow(player);
  };
}
