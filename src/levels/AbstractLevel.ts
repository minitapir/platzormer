import { GameObjects, Tilemaps } from "phaser";
import AbilityManager from "../scenes/managers/AbilityManager";
import CheckpointManager from "../scenes/managers/CheckpointManager";
import EndLevelManager from "../scenes/managers/EndLevelManager";
import EnemyManager from "../scenes/managers/EnemyManager";
import PlayerManager from "../scenes/managers/PlayerManager";

export class Collider {
  layer: Tilemaps.TilemapLayer;
  behavior: () => void;
  constructor(layer: Tilemaps.TilemapLayer, behavior: () => void = () => {}) {
    this.layer = layer;
    this.behavior = behavior;
  }
}

export interface Control {
  name: string;
  control: Phaser.Input.Keyboard.Key;
}

export default abstract class AbstractLevel extends Phaser.Scene {
  // Global scene variables
  public map!: Tilemaps.Tilemap;
  protected mapKey!: string;
  protected colliders: Collider[];
  protected spikes!: Phaser.Physics.Arcade.Group;
  protected arrowWalls!: Phaser.Physics.Arcade.Group;
  protected arrows!: Phaser.Physics.Arcade.Group;
  protected controls: Control[];
  protected texts: GameObjects.Text[];

  // Managers
  protected playerManager!: PlayerManager;
  protected enemyManager!: EnemyManager;
  protected endLevelManager!: EndLevelManager;
  protected checkpointManager!: CheckpointManager;
  protected abilityManager!: AbilityManager;

  // Enemies variables
  protected arrowSpeed: number;
  protected timeSinceLastArrowFired: number;
  protected arrowSpawnDelay: number;

  constructor(name: string) {
    super(name);
    this.controls = [];
    this.colliders = [];
    this.texts = [];
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
    this.playerManager.update(delta);
    this.enemyManager.update(delta);
    this.fireArrows(delta);
    this.moveArrows();
  };

  public getControl = (name: string): Control | undefined => {
    return this.controls.find((control) => control.name === name);
  };

  // Private fields
  /**
   * This method handles images loading at game creation.
   */
  private preloadMapImages = (): void => {
    this.load.image("background", "assets/images/background.png");
    this.load.image("tiles", "assets/images/tileset.png");
    this.load.image("checkpoints", "assets/images/checkpoints.png");
    this.load.spritesheet("tilesetSprite", "assets/images/tileset.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    // Idle
    this.load.spritesheet(
      "playerIdleGreen",
      "assets/images/animSpritesheets/Idle/green.png",
      {
        frameWidth: 32,
        frameHeight: 64,
        startFrame: 0,
        endFrame: 15,
      }
    );
    this.load.spritesheet(
      "playerIdleBlue",
      "assets/images/animSpritesheets/Idle/blue.png",
      {
        frameWidth: 32,
        frameHeight: 64,
        startFrame: 0,
        endFrame: 15,
      }
    );

    // Jump
    this.load.spritesheet(
      "playerJumpGreen",
      "assets/images/animSpritesheets/Jump/green.png",
      {
        frameWidth: 32,
        frameHeight: 64,
        startFrame: 0,
        endFrame: 6,
      }
    );
    this.load.spritesheet(
      "playerJumpBlue",
      "assets/images/animSpritesheets/Jump/blue.png",
      {
        frameWidth: 32,
        frameHeight: 64,
        startFrame: 0,
        endFrame: 6,
      }
    );

    // Walk
    this.load.spritesheet(
      "playerWalkGreen",
      "assets/images/animSpritesheets/Walk/green.png",
      {
        frameWidth: 32,
        frameHeight: 64,
        startFrame: 0,
        endFrame: 6,
      }
    );

    // Run (only blue)
    this.load.spritesheet(
      "playerRunBlue",
      "assets/images/animSpritesheets/Run/blue.png",
      {
        frameWidth: 32,
        frameHeight: 64,
        startFrame: 0,
        endFrame: 3,
      }
    );

    this.load.spritesheet("ghost", "assets/images/ghost.png", {
      frameWidth: 32,
      frameHeight: 64,
    });
    this.load.spritesheet(
      "arrows",
      "assets/images/animSpritesheets/arrows.png",
      {
        frameWidth: 96,
        frameHeight: 32,
      }
    );
    this.preloadLevelAssets();

    this.load.audio("boucle_game", "assets/music/boucle_game.mp3");
    this.load.audio("fireArrow", "assets/music/arrow.mp3");
  };

  /**
   * This method handles background and map creation.
   */
  private setupMap = (): void => {
    this.add.image(0, 0, "background").setOrigin(0, 0).setScrollFactor(0, 0);
    this.map = this.make.tilemap({
      key: this.mapKey,
      tileHeight: 32,
      tileWidth: 32,
    }) as Tilemaps.Tilemap;
    let tileset = this.map.addTilesetImage("tileset", "tiles", 32, 32);

    // Music
    if (this.sound.getAll("boucle_game").length === 0) {
      this.sound.add("boucle_game").setLoop(true).setVolume(0.02).play();
    }

    // Managers
    this.playerManager = new PlayerManager(this, "player");
    this.enemyManager = new EnemyManager(this, "ghost", this.playerManager);
    this.checkpointManager = new CheckpointManager(
      this,
      "checkpoints",
      this.playerManager.player
    );

    // Controls
    const space = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    const q = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    const d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const j = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.controls.push({ name: "jump", control: space });
    this.controls.push({ name: "left", control: q });
    this.controls.push({ name: "right", control: d });
    this.controls.push({ name: "action", control: j });

    // Colliders
    const ground = new Collider(this.map.createLayer("ground", tileset));
    ground.layer.setCollisionByExclusion([-1]);

    this.events.addListener("reset", this.reset);

    // Background
    this.map.createLayer("background", tileset);

    // Climbable walls
    const wall = new Collider(
      this.map.createLayer("wall", tileset),
      this.playerManager.wallClimb
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
    // Arrows animation
    this.anims.create({
      key: "arrow",
      frames: this.anims.generateFrameNumbers("arrows", {
        start: 0,
        end: 8,
      }),
      frameRate: 10,
      repeat: -1,
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

    // Help texts
    const textsPhysics = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.map.getObjectLayer("helpText").objects.forEach((text, i) => {
      const textObject = this.add
        .rectangle(text.x, text.y, text.width, text.height)
        .setOrigin(0, 0)
        .setData("index", i);
      const textToAdd = this.add.text(
        text.x,
        text.y,
        text.properties[0].value,
        {
          font: "25px Arial",
          align: "center",
        }
      );
      textToAdd.setAlpha(0);
      this.texts.push(textToAdd);
      this.physics.add.overlap(
        this.playerManager.player,
        textObject,
        (player, text) => {
          const textIndex = text.getData("index") as integer;
          this.tweens.add({
            targets: this.texts[textIndex],
            alpha: 1,
            ease: "Power1",
            duration: 1000,
            onComplete: () => {
              this.tweens.add({
                targets: this.texts[textIndex],
                alpha: 0,
                ease: "Power1",
                duration: 1000,
                onComplete: () => {
                  this.texts[textIndex].setAlpha(0);
                },
              });
            },
          });
        }
      );
      textsPhysics.add(textObject);
    });

    // Levels can add their own logic
    this.customSetupMap();
  };

  private setupManagers = (): void => {
    // Colliders
    this.colliders.forEach((collider) => {
      this.physics.add.collider(
        this.playerManager.player,
        collider.layer,
        collider.behavior
      );
      // Destroy arrows when touching terrain
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
      this.reset
    );

    // Arrows
    this.physics.add.collider(
      this.playerManager.player,
      this.arrows,
      this.reset
    );

    // Enemies
    this.enemyManager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithEnemy",
      "collideWithPlayer",
      this.playerManager.handleCollisionWithEnemy,
      this.enemyManager.handleCollisionWithPlayer
    );

    // Checkpoints
    this.checkpointManager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithCheckpoint",
      "collideWithPlayer",
      this.playerManager.checkpointReached,
      this.checkpointManager.collected
    );

    this.customLevelManagers();
  };

  protected setupCamera = (): void => {
    let cam = this.cameras.main.setBounds(0, 0, 1920, 4460);
    cam.setZoom(1.5);
    cam.startFollow(this.playerManager.player);
  };

  private reset = () => {
    this.playerManager.player.emit("respawn");
    this.enemyManager.respawnAll();
    this.resetArrows();
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
          const newArrow = this.arrows.get(
            wall.x + 32,
            wallY,
            "arrows",
            1
          ) as GameObjects.Sprite;
          this.sound.play("fireArrow", {
            volume: 0.1,
          });
          newArrow.play("arrow", true);
        }
      });
      this.timeSinceLastArrowFired = 0;
    }
    this.timeSinceLastArrowFired += delta;
  };

  private moveArrows = (): void => {
    this.arrows.children.getArray().forEach((arrow) => {
      arrow.setVelocityX(-this.arrowSpeed);
    });
  };

  private resetArrows = (): void => {
    this.arrows.children.getArray().forEach((arrow) => {
      arrow.destroy();
    });
  };

  // Abstract methods to override
  protected abstract preloadLevelAssets: () => void;
  protected abstract customSetupMap: () => void;
  protected abstract customLevelManagers: () => void;
  protected abstract endLevel: () => void;
}
