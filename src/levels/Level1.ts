import Phaser, { GameObjects, Tilemaps } from "phaser";
import AbilityManager from "../scenes/managers/Ability2Manager";
import CheckpointManager from "../scenes/managers/CheckpointManager";
import EndLevelManager from "../scenes/managers/EndLevelManager";
import EnemyManager from "../scenes/managers/EnemyManager";
import PlayerManager from "../scenes/managers/PlayerManager";
import TimeBonusManager from "../scenes/managers/TimeBonusManager";

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

export default class Level1 extends Phaser.Scene {
  // Global scene variables
  public map!: Tilemaps.Tilemap;
  private colliders: Collider[];
  private spikes!: Phaser.Physics.Arcade.Group;
  private arrowWalls!: Phaser.Physics.Arcade.Group;
  private arrows!: Phaser.Physics.Arcade.Group;
  private controls: Control[];

  // Managers
  private playerManager!: PlayerManager;
  private enemyManager!: EnemyManager;
  private timeBonusManager!: TimeBonusManager;
  private endLevelManager!: EndLevelManager;
  private checkpointManager!: CheckpointManager;
  private ability2Manager!: AbilityManager;

  // Enemies variables
  private arrowSpeed: number;
  private timeSinceLastArrowFired: number;
  private arrowSpawnDelay: number;

  constructor() {
    super("Level1");
    // Controls
    this.controls = [];

    this.colliders = [];
    this.timeSinceLastArrowFired = 0;
    this.arrowSpawnDelay = 1000;
    this.arrowSpeed = 250;
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
    this.load.image("timeBonus", "assets/images/timeBonus.png");
    this.load.image("checkpoints", "assets/images/checkpoints.png");
    this.load.image("power2", "assets/images/power2.png");
    this.load.image("power3", "assets/images/power3.png");
    this.load.spritesheet("tilesetSprite", "assets/images/tileset.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("player", "assets/images/charac.png", {
      frameWidth: 32,
      frameHeight: 64,
    });
    this.load.spritesheet("ghost", "assets/images/ghost.png", {
      frameWidth: 32,
      frameHeight: 64,
    });
    this.load.spritesheet("arrows", "assets/images/animSpritesheets/arrows.png", {
      frameWidth: 96,
      frameHeight: 32,
    });
  };

  /**
   * This method handles background and map creation.
   */
  private setupMap = (): void => {
    this.add.image(0, 0, "background").setOrigin(0, 0).setScrollFactor(0, 0);
    this.map = this.make.tilemap({
      key: "map",
      tileHeight: 32,
      tileWidth: 32,
    }) as Tilemaps.Tilemap;
    let tileset = this.map.addTilesetImage("tileset", "tiles", 32, 32);

    // Colliders
    const ground = new Collider(this.map.createLayer("ground", tileset));
    ground.layer.setCollisionByExclusion([-1]);

    // Background 
     this.map.createLayer("background", tileset);

    // Climbable walls
    const wall = new Collider(
      this.map.createLayer("wall", tileset),
      this.wallClimb
    );
    wall.layer.setCollisionByExclusion([-1]);

    this.colliders.push(ground);
    this.colliders.push(wall);

    // Game Objects
    // Arrow walls
    this.arrowWalls = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.map.getObjectLayer("wallArrows").objects.forEach((arrowWall) => {
      const arrowWallObject = this.map?.createFromObjects("wallArrows", {
        key: "tilesetSprite",
        id: arrowWall.id,
        frame: 297,
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
        frame: 512,
      })[0] as Phaser.GameObjects.GameObject;
      this.spikes.add(spikeObject);
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
      "ghost",
      this.playerManager.player
    );
    this.enemyManager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithEnemy",
      "collideWithPlayer",
      this.playerManager.playerHit,
      this.enemyManager.enemyHit
    );

    // Checkpoints
    this.checkpointManager = new CheckpointManager(
      this,
      "checkpoints",
      this.playerManager.player
    );
    this.checkpointManager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithCheckpoint",
      "collideWithPlayer",
      this.playerManager.checkpointReached,
      this.checkpointManager.collected
    );

    // Time Bonus
    this.timeBonusManager = new TimeBonusManager(
      this,
      "timeBonus",
      this.playerManager.player
    );

    this.timeBonusManager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithTimeBonus",
      "collideWithPlayer",
      this.playerManager.timeBonusCollected,
      this.timeBonusManager.collected
    );

    // Power 2
    this.ability2Manager = this.abilityManager = new AbilityManager(
      this,
      "power2",
      this.playerManager.player
    );
    this.ability2Manager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithPower2",
      "collideWithPlayer",
      this.playerManager.power2Collected,
      this.abilityManager.collected
    );

    // End level
    this.endLevelManager = new EndLevelManager(
      this,
      "endLevel",
      this.playerManager.player
    );

    this.endLevelManager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithEndLevel",
      "collideWithPlayer",
      this.playerManager.win,
      () => {}
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
    cam.setZoom(1);
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
          const newArrow = this.arrows.get(wall.x + 32, wallY, "arrows", 1) as GameObjects.Sprite;
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
      arrow.setVelocityX(-this.arrowSpeed);
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
