import Phaser, { Tilemaps } from "phaser";

export interface Control {
  name: string;
  control: Phaser.Input.Keyboard.Key;
}

export default class GameScene extends Phaser.Scene {
  private speed: integer;
  private map: Tilemaps.Tilemap | undefined;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private controls: Control[];

  // Control variables
  private canJump: boolean;
  private currentJumpCount: integer;
  private jumpMax: integer;
  private jumpStrength: integer;

  private getControl = (name: string): Control | undefined => {
    return this.controls.find((control) => control.name === name);
  };

  constructor() {
    super("GameScene");
    this.controls = [];
    this.speed = 300;
    this.jumpStrength = 450;
    this.canJump = true;
    this.jumpMax = 2;
    this.currentJumpCount = this.jumpMax;
  }

  preload = (): void => {
    this.preloadMapImages();
  };

  create = (): void => {
    let colliders = this.setupMap();
    this.setupPlayer(colliders);
    this.setupCamera();
  };

  update = (): void => {
    this.setVelocity();
    this.handleJump();
  };

  // Private fields

  /**
   * This method handles images loading at game creation.
   */
  private preloadMapImages = (): void => {
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
  private setupMap = (): Tilemaps.TilemapLayer[] => {
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

  private setupPlayer = (colliders: Tilemaps.TilemapLayer[]): void => {
    this.player = this.physics.add.sprite(64, 4000, "player").setOrigin(0, 0);

    // Colliders
    colliders.forEach((collider) =>
      this.physics.add.collider(this.player, collider)
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

    // Controls
    const space = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    const q = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    const d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.controls.push({ name: "jump", control: space });
    this.controls.push({ name: "left", control: q });
    this.controls.push({ name: "right", control: d });
    this.controls.push({ name: "action", control: a });
  };

  private setupCamera = (): void => {
    let cam = this.cameras.main.setBounds(0, 0, 1920, 4460);
    cam.setZoom(1.5);
    cam.startFollow(this.player);
  };

  private setVelocity = (): void => {
    if (this.getControl("left")?.control.isDown) {
      this.player.setVelocityX(-this.speed);
    } else if (this.getControl("right")?.control.isDown) {
      this.player.setVelocityX(this.speed);
    } else {
      this.player.setVelocityX(0);
    }
    this.player.anims.play("yellow");
  };

  private handleJump = (): void => {
    if (this.player.body.blocked.down) {
      this.currentJumpCount = this.jumpMax;
    }

    if (
      this.getControl("jump")?.control.isDown &&
      this.currentJumpCount > 0 &&
      this.canJump
    ) {
      //si Z est appuyé, que la var jump est encore utilisable et que le joueur peut sauter,
      //alors il a le droit à un autre saut et saute
      this.currentJumpCount--;
      this.canJump = false;
      this.player.setVelocityY(-this.jumpStrength);
    }
    if (this.getControl("jump")?.control.isUp) {
      //lorsque la touche Z n'est plus appuyée, alors il remplit une des conditions pour sauter de nouveau
      this.canJump = true;
    }
  };
}
