import Phaser, { GameObjects, Tilemaps } from "phaser";

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
  private map: Tilemaps.Tilemap | undefined;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private colliders: Collider[];
  private spikes!: Phaser.Physics.Arcade.Group;
  private winFlags!: Phaser.Physics.Arcade.Group;
  private arrowWalls!: Phaser.Physics.Arcade.Group;
  private arrows!: Phaser.Physics.Arcade.Group;

  // Control variables
  private speed: integer;
  private controls: Control[];
  private canJump: boolean;
  private currentJumpCount: integer;
  private jumpMax: integer;
  private jumpStrength: integer;

  // Abilities variables
  private abilitiesCount: integer;
  private currentAbility: integer;
  private abilityChangeDelay: integer;
  private timeSinceLastAbilityChange: number;

  // Enemies variables
  private arrowSpeed: number;
  private timeSinceLastArrowFired: number;
  private arrowSpawnDelay: number;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyDetectRange: number;
  private enemySpeed: number;

  private getControl = (name: string): Control | undefined => {
    return this.controls.find((control) => control.name === name);
  };

  constructor() {
    super("GameScene");
    this.controls = [];
    this.colliders = [];
    this.speed = 300;
    this.jumpStrength = 450;
    this.canJump = true;
    this.jumpMax = 2;
    this.currentJumpCount = this.jumpMax;
    this.abilitiesCount = 3;
    this.currentAbility = 0;
    this.abilityChangeDelay = 1000;
    this.timeSinceLastAbilityChange = 0;
    this.timeSinceLastArrowFired = 0;
    this.arrowSpawnDelay = 1000;
    this.arrowSpeed = 400;
    this.enemyDetectRange = 300;
    this.enemySpeed = 150;
  }

  preload = (): void => {
    this.preloadMapImages();
  };

  create = (): void => {
    this.setupMap();
    this.setupPlayer();
    this.setupCamera();
  };

  update = (time: number, delta: number): void => {
    this.setVelocity();
    this.handleJump();
    this.handleAbility(delta);
    this.fireArrows(delta);
    this.moveArrows();
    this.moveEnemies();
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

    // Enemies
    // Spikes
    this.enemies = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.map.getObjectLayer("enemies").objects.forEach((enemy) => {
      const enemyObject = this.map?.createFromObjects("enemies", {
        key: "tilesetSprite",
        id: enemy.id,
        frame: 191,
      })[0] as Phaser.GameObjects.GameObject;
      this.enemies.add(enemyObject);
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

  private setupPlayer = (): void => {
    this.player = this.physics.add.sprite(64, 4064, "player").setOrigin(0, 0);

    // Colliders
    this.colliders.forEach((collider) => {
      this.physics.add.collider(this.player, collider.layer, collider.behavior);
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
    this.physics.add.collider(this.player, this.arrowWalls);

    // Spikes
    this.physics.add.collider(this.player, this.spikes, this.playerHit);

    // Arrows
    this.physics.add.collider(this.player, this.arrows, this.playerHit);

    // Enemies
    this.physics.add.collider(this.player, this.enemies, this.playerHit);

    // Win flags
    this.physics.add.collider(this.player, this.winFlags, this.playerHit);

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

  /**
   * When player has the same Y position as an arrow wall
   * Trigger an arrow.
   */
  private fireArrows = (delta: number): void => {
    if (this.timeSinceLastArrowFired >= this.arrowSpawnDelay) {
      this.arrowWalls.children.getArray().forEach((wall) => {
        const playerY = Math.round(this.player.y) + 64;
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

  private moveEnemies = (): void => {
    this.enemies.children.each((enemy) => {
      if (
        Phaser.Math.Distance.BetweenPoints(
          enemy.body.position,
          this.player.body.position
        ) < this.enemyDetectRange
      ) {
        this.physics.moveToObject(enemy, this.player, this.enemySpeed);
      } else {
        enemy.body.setVelocity(
          Math.max(enemy.body.velocity.x - 0.50, 0),
          Math.max(enemy.body.velocity.y - 0.50, 0)
        );
      }
    });
  };

  /**
   * When player is hit, reset.
   */
  private playerHit = (): void => {
    this.currentAbility = 0;
    this.player.setVelocity(0, 0);
    this.player.setX(64);
    this.player.setY(4000);
    this.player.setAlpha(0);
    this.tweens.add({
      targets: this.player,
      alpha: 1,
      duration: 100,
      ease: "Linear",
      repeat: 5,
    });
  };

  private wallClimb = (): void => {
    this.currentJumpCount = 0;
    if (this.currentAbility === 0 || this.currentAbility === 3) {
      if (
        this.getControl("left")?.control.isDown ||
        this.getControl("right")?.control.isDown
      ) {
        if (this.player.body.blocked.left || this.player.body.blocked.right) {
          this.player.setVelocityY(-this.speed);
        }
      }
    }
  };

  private nextAbility = () => {
    if (this.timeSinceLastAbilityChange >= this.abilityChangeDelay) {
      this.currentAbility++;
      if (this.currentAbility === this.abilitiesCount) {
        this.currentAbility = 0;
      }
      this.timeSinceLastAbilityChange = 0;
    }
  };

  private handleAbility = (delta: number): void => {
    this.timeSinceLastAbilityChange += delta;
    if (this.getControl("action")?.control.isDown) {
      this.nextAbility();
    }

    if (this.currentAbility === 0) {
      this.player.anims.play("yellow");
    }

    if (this.currentAbility === 1) {
      this.player.anims.play("blue");

      this.speed = 500;
      this.jumpMax = 2;
      this.jumpStrength = 500;
    } else {
      this.speed = 300;
      this.jumpMax = 1;
      this.jumpStrength = 450;
    }

    if (this.currentAbility === 2) {
      this.player.anims.play("purple");
    }
  };
}
