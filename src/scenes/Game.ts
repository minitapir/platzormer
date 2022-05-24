import Phaser, { Tilemaps } from "phaser";
import EnemyInteraction from "./behaviors/EnemyInteraction";
import EnemyManager from "./managers/EnemyManager";
import PlayerManager from "./managers/PlayerManager";

export interface Control {
  name: string;
  control: Phaser.Input.Keyboard.Key;
}

export class Collider {
  layer: Tilemaps.TilemapLayer;
  behavior: () => void;
  constructor(layer: Tilemaps.TilemapLayer, behavior: () => void = () => {}) {
    this.layer = layer;
    this.behavior = behavior;
  }
}

export default class GameScene extends Phaser.Scene {
  // Global scene variables
  public map!: Tilemaps.Tilemap;
  private colliders: Collider[];
  private spikes!: Phaser.Physics.Arcade.Group;
  private winFlags!: Phaser.Physics.Arcade.Group;
  private arrowWalls!: Phaser.Physics.Arcade.Group;
  private arrows!: Phaser.Physics.Arcade.Group;
  private controls: Control[];

  // Managers
  private playerManager!: PlayerManager;
  private enemyManager!: EnemyManager;

  // Enemies variables
  private arrowSpeed: number;
  private timeSinceLastArrowFired: number;
  private arrowSpawnDelay: number;

  constructor() {
    super("GameScene");
    // Controls
    this.controls = [];

    this.colliders = [];
    this.timeSinceLastArrowFired = 0;
    this.arrowSpawnDelay = 1000;
    this.arrowSpeed = 400;
  }

  preload = (): void => {
    this.preloadMapImages();
  };

  create = (): void => {
    this.setupMap();
    this.setupManagers();
    this.setupCamera();
  };

  update = (time: number, delta: number): void => {
    this.playerManager.update();
    this.handleAbility(delta);
    this.fireArrows(delta);
    this.moveArrows();
    this.enemyManager.update();
  };

  public getControl = (name: string): Control | undefined => {
    return this.controls.find((control) => control.name === name);
  };

  // Private fields
  /**
   * This method handles images loading at game creation.
   */
  private preloadMapImages = (): void => {
    this.load.tilemapTiledJSON("map", "assets/images/map1.json");
    this.load.image("background", "assets/images/background.png");
    this.load.image("tiles", "assets/images/tileset.png");
    this.load.image("arrow", "assets/images/arrow.png");
    this.load.spritesheet("tilesetSprite", "assets/images/tileset.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("player", "assets/images/charac.png", {
      frameWidth: 32,
      frameHeight: 64,
    });
  };

  /**
   * This method handles background and map creation.
   */
  private setupMap = (): void => {
    this.add.image(0, 0, "background").setOrigin(0, 0).setScrollFactor(0, 0);
    this.map = this.make.tilemap({ key: "map" }) as Tilemaps.Tilemap;
    let tileset = this.map.addTilesetImage("tileset", "tiles");

    // Colliders
    const ground = new Collider(this.map.createLayer("ground", tileset));
    ground.layer.setCollisionByExclusion([-1]);

    // Climbable walls
    const wall = new Collider(
      this.map.createLayer("wall", tileset),
      this.wallClimb
    );
    wall.layer.setCollisionByExclusion([-1]);

    this.colliders.push(ground);
    this.colliders.push(wall);

    // Background objects
    for (let i = 3; i > 0; i--) {
      this.map.createLayer("backgroundlayer" + i, tileset);
    }

    // Game Objects
    // Arrow walls
    this.arrowWalls = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.map.getObjectLayer("arrowWalls").objects.forEach((arrowWall) => {
      const arrowWallObject = this.map?.createFromObjects("arrowWalls", {
        key: "tilesetSprite",
        id: arrowWall.id,
        frame: 64,
      })[0] as Phaser.GameObjects.GameObject;
      this.arrowWalls.add(arrowWallObject);
    });

    // Arrows (yet to be spawned)
    this.arrows = this.physics.add.group({
      allowGravity: false,
      immovable: false,
    });

    // Spikes
    this.spikes = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.map.getObjectLayer("spikes").objects.forEach((spike) => {
      const spikeObject = this.map?.createFromObjects("spikes", {
        key: "tilesetSprite",
        id: spike.id,
        frame: 196,
      })[0] as Phaser.GameObjects.GameObject;
      this.spikes.add(spikeObject);
    });

    // Win Flags
    this.winFlags = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.map.getObjectLayer("winFlags").objects.forEach((winFlag) => {
      const winFlagObject = this.map?.createFromObjects("winFlags", {
        key: "tilesetSprite",
        id: winFlag.id,
        frame: 203,
      })[0] as Phaser.GameObjects.GameObject;
      this.winFlags.add(winFlagObject);
    });
  };

  private setupManagers = (): void => {
    this.playerManager = new PlayerManager(this, "player");

    // Colliders
    this.colliders.forEach((collider) => {
      this.physics.add.collider(
        this.playerManager.player,
        collider.layer,
        collider.behavior
      );
      this.physics.add.collider(
        this.arrows,
        collider.layer,
        (collider, collided) => {
          collider.destroy();
        }
      );
    });

    // Game Objects
    // Arrow walls
    this.physics.add.collider(this.playerManager.player, this.arrowWalls);

    // Spikes
    this.physics.add.collider(
      this.playerManager.player,
      this.spikes,
      this.playerManager.playerHit
    );

    // Arrows
    this.physics.add.collider(
      this.playerManager.player,
      this.arrows,
      this.playerManager.playerHit
    );

    // Enemies
    this.enemyManager = new EnemyManager(
      this,
      "enemies",
      this.playerManager.player
    );
    this.enemyManager.addCollision(
      this.playerManager.player.body.gameObject,
      new EnemyInteraction()
    );

    // Win flags
    this.physics.add.collider(
      this.playerManager.player,
      this.winFlags,
      this.playerManager.playerHit
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
    cam.startFollow(this.playerManager.player);
  };

  /**
   * When player has the same Y position as an arrow wall
   * Trigger an arrow.
   */
  private fireArrows = (delta: number): void => {
    if (this.timeSinceLastArrowFired >= this.arrowSpawnDelay) {
      this.arrowWalls.children.getArray().forEach((wall) => {
        const playerY = Math.round(this.playerManager.player.y) + 64;
        const wallY = Math.round(wall.y);
        if (playerY >= wallY && playerY <= wallY + 32) {
          this.arrows.get(wall.x + 32, wallY, "arrow");
        }
      });
      this.timeSinceLastArrowFired = 0;
    }
    this.timeSinceLastArrowFired += delta;
  };

  /**
   * TODO : implement fire arrow to the left or right, defining it at spawn
   */
  private moveArrows = (): void => {
    this.arrows.children.getArray().forEach((arrow) => {
      arrow.setVelocityX(this.arrowSpeed);
    });
  };

  private wallClimb = (): void => {
    this.playerManager.currentJumpCount = 0;
    if (
      this.playerManager.currentAbility === 0 ||
      this.playerManager.currentAbility === 3
    ) {
      if (
        this.getControl("left")?.control.isDown ||
        this.getControl("right")?.control.isDown
      ) {
        if (
          this.playerManager.player.body.blocked.left ||
          this.playerManager.player.body.blocked.right
        ) {
          this.playerManager.player.setVelocityY(
            -this.playerManager.playerSpeed
          );
        }
      }
    }
  };

  private nextAbility = () => {
    if (
      this.playerManager.timeSinceLastAbilityChange >=
      this.playerManager.abilityChangeDelay
    ) {
      this.playerManager.currentAbility++;
      if (
        this.playerManager.currentAbility === this.playerManager.abilitiesCount
      ) {
        this.playerManager.currentAbility = 0;
      }
      this.playerManager.timeSinceLastAbilityChange = 0;
    }
  };

  private handleAbility = (delta: number): void => {
    this.playerManager.timeSinceLastAbilityChange += delta;
    if (this.getControl("action")?.control.isDown) {
      this.nextAbility();
    }

    if (this.playerManager.currentAbility === 0) {
      this.playerManager.player.anims.play("yellow");
    }

    if (this.playerManager.currentAbility === 1) {
      this.playerManager.player.anims.play("blue");

      this.playerManager.playerSpeed = 500;
      this.playerManager.jumpMax = 2;
      this.playerManager.jumpStrength = 500;
    } else {
      this.playerManager.playerSpeed = 300;
      this.playerManager.jumpMax = 1;
      this.playerManager.jumpStrength = 450;
    }

    if (this.playerManager.currentAbility === 2) {
      this.playerManager.player.anims.play("purple");
    }
  };
}
