import { GameObjects } from "phaser";
import GameScene from "../../levels/Level1";
import PhysicsManager from "./PhysicsManager";

export default class PlayerManager extends PhysicsManager {
  public player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  public spawnPoint: Phaser.Math.Vector2;
  public playerSpeed: integer;
  public canJump: boolean;
  public currentJumpCount: integer;
  public jumpMax: integer;
  public jumpStrength: integer;

  // Abilities variables
  public hasPower: boolean[];
  public abilitiesCount: integer;
  public currentAbility: integer;
  public abilityChangeDelay: integer;
  public timeSinceLastAbilityChange: number;

  constructor(protected scene: GameScene, protected name: string) {
    super(scene, name);

    // Player spawn point
    const spawnPoint =
      this.scene.map.getObjectLayer("spawnPointPlayer").objects[0];

    this.spawnPoint = new Phaser.Math.Vector2(
      spawnPoint.x as number,
      spawnPoint.y as number
    );

    this.player = this.scene.physics.add
      .sprite(this.spawnPoint.x, this.spawnPoint.y, "playerIdleGreen")
      .setOrigin(0, 0);

    this.player.addListener("respawn", this.respawn);

    // Player settings
    this.playerSpeed = 300;
    this.canJump = true;
    this.jumpStrength = 450;
    this.jumpMax = 1;
    this.currentJumpCount = this.jumpMax;

    // Abilities
    this.abilitiesCount = 2;
    this.currentAbility = 0;
    this.abilityChangeDelay = 200;
    this.timeSinceLastAbilityChange = 0;
    this.hasPower = [true, false]; // By default, has only climb power

    // Animations
    // Idle
    const idleAnimations = ["playerIdleGreen", "playerIdleBlue"];
    idleAnimations.forEach((animation, index) => {
      this.scene.anims.create({
        key: animation,
        frames: this.player.anims.generateFrameNumbers(animation, {
          start: 0,
          end: 15,
        }),
        frameRate: 10,
        repeat: -1,
        yoyo: true,
      });
    });
    this.player.play(this.getIdleAnimation(), true);

    // Jump
    const jumpAnimations = ["playerJumpGreen", "playerJumpBlue"];
    jumpAnimations.forEach((animation, index) => {
      this.scene.anims.create({
        key: animation,
        frames: this.player.anims.generateFrameNumbers(animation, {
          start: 0,
          end: 6,
        }),
        frameRate: 10,
        repeat: -1,
        yoyo: true,
      });
    });

    // Walk
    const walkAnimations = ["playerWalkGreen"];
    walkAnimations.forEach((animation, index) => {
      this.scene.anims.create({
        key: animation,
        frames: this.player.anims.generateFrameNumbers(animation, {
          start: 0,
          end: 6,
        }),
        frameRate: 10,
        repeat: -1,
        yoyo: true,
      });
    });

    // Run
    const runAnimations = ["playerRunBlue"];
    runAnimations.forEach((animation, index) => {
      this.scene.anims.create({
        key: animation,
        frames: this.player.anims.generateFrameNumbers(animation, {
          start: 0,
          end: 3,
        }),
        frameRate: 10,
        repeat: -1,
        yoyo: true,
      });
    });
  }

  public update = (delta: number): void => {
    this.setVelocity();
    this.handleJump();
    this.handleAbility(delta);
  };

  public addCollider = (
    collider: GameObjects.GameObject,
    colliderEventName: string,
    collidedEventName: string,
    colliderCallback: () => void,
    collidedCallback: () => void
  ): void => {};

  private handleJump = (): void => {
    if (this.player.body.blocked.down) {
      this.currentJumpCount = this.jumpMax;
    }
    if (
      this.scene.getControl("jump")?.control.isDown &&
      this.currentJumpCount > 0 &&
      this.canJump
    ) {
      this.player.play(this.getJumpAnimation(), true);
      //si Z est appuy??, que la var jump est encore utilisable et que le joueur peut sauter,
      //alors il a le droit ?? un autre saut et saute
      this.currentJumpCount--;
      this.canJump = false;
      this.player.setVelocityY(-this.jumpStrength);
    }
    if (this.scene.getControl("jump")?.control.isUp) {
      //lorsque la touche Z n'est plus appuy??e, alors il remplit une des conditions pour sauter de nouveau
      this.canJump = true;
    }
  };

  private getIdleAnimation = (): string => {
    if (this.currentAbility === 0) {
      return "playerIdleGreen";
    } else {
      return "playerIdleBlue";
    }
  };

  private getJumpAnimation = (): string => {
    if (this.currentAbility === 0) {
      return "playerJumpGreen";
    } else {
      return "playerJumpBlue";
    }
  };

  private getMoveAnimation = (): string => {
    if (this.player.body.blocked.down) {
      if (this.currentAbility === 0) {
        return "playerWalkGreen";
      } else {
        return "playerRunBlue";
      }
    }
    return this.player.anims.getName();
  };

  private terminalVelocityCheck = (): void => {
    if (this.player.body.velocity.y != 0) {
      if (!this.player.anims.getName().includes("Jump")) {
        this.player.play(this.getJumpAnimation(), true);
      }
      if (this.player.body.velocity.y > 800) {
        this.player.setVelocityY(800);
      }
    }
  };

  private setVelocity = (): void => {
    if (this.player.body.y < 0) {
      this.player.body.y = this.scene.map.heightInPixels;
    } else if (this.player.body.y > this.scene.map.heightInPixels) {
      this.scene.events.emit("reset");
    } else if (this.player.body.x < 0) {
      this.player.body.stop();
      this.player.body.position.x = 0;
    } else if (this.player.body.x > this.scene.map.widthInPixels - 32) {
      this.player.body.stop();
      this.player.body.position.x = this.scene.map.widthInPixels - 32;
    } else {
      if (this.scene.getControl("left")?.control.isDown) {
        this.player.setVelocityX(-this.playerSpeed);
        this.player.setFlipX(true);
        this.player.play(this.getMoveAnimation(), true);
      } else if (this.scene.getControl("right")?.control.isDown) {
        this.player.setVelocityX(this.playerSpeed);
        this.player.setFlipX(false);
        this.player.play(this.getMoveAnimation(), true);
      } else {
        if (this.player.body.velocity.y === 0) {
          this.player.play(this.getIdleAnimation(), true);
        }
        this.player.setVelocityX(0);
      }
      this.terminalVelocityCheck();
    }
  };

  // Abilities
  private handleAbility = (delta: number): void => {
    let abilityChange = false;
    this.timeSinceLastAbilityChange += delta;
    if (this.scene.getControl("action")?.control.isDown) {
      this.nextAbility();
      abilityChange = true;
    }

    if (this.currentAbility === 0 && abilityChange) {
      this.playerSpeed = 300;
      this.jumpMax = 1;
      this.jumpStrength = 450;
      this.player.play(
        {
          key: "playerIdleGreen",
        },
        true
      );
    }

    if (this.currentAbility === 1 && abilityChange) {
      this.player.play(
        {
          key: "playerIdleBlue",
        },
        true
      );

      this.playerSpeed = 500;
      this.jumpMax = 2;
      this.jumpStrength = 500;
    }
  };

  /**
   * Find next available ability
   */
  private nextAbility = () => {
    if (this.timeSinceLastAbilityChange >= this.abilityChangeDelay) {
      let foundNextPower = false;
      let i = this.currentAbility + 1;
      while (!foundNextPower) {
        // If we are at array's end, loop at its begining
        if (i === this.abilitiesCount) {
          i = 0;
        }
        if (this.hasPower[i]) {
          this.currentAbility = i;
          this.timeSinceLastAbilityChange = 0;
          foundNextPower = true;
        }
        i += 1;
      }
    }
  };

  public wallClimb = (): void => {
    this.currentJumpCount = 0;
    if (this.currentAbility === 0 || this.currentAbility === 3) {
      if (
        this.scene.getControl("left")?.control.isDown ||
        this.scene.getControl("right")?.control.isDown
      ) {
        if (this.player.body.blocked.left || this.player.body.blocked.right) {
          this.player.setVelocityY(-this.playerSpeed);
        }
      }
    }
  };

  /**
   * When player is hit, reset.
   */
  protected override respawn = (): void => {
    this.currentAbility = 0;
    this.jumpMax = 1;
    this.playerSpeed = 300;
    this.jumpStrength = 450;
    this.player.setVelocity(0, 0);
    this.player.setX(this.spawnPoint.x);
    this.player.setY(this.spawnPoint.y);
    this.player.setAlpha(0);
    this.scene.tweens.add({
      targets: this.player,
      alpha: 1,
      duration: 100,
      ease: "Linear",
      repeat: 5,
    });
  };

  public handleCollisionWithEnemy = ([player, enemy]: [
    GameObjects.Sprite,
    GameObjects.Sprite
  ]): void => {
    if (enemy.body.touching.up) {
      this.player.setVelocityY(-this.jumpStrength * 1.5);
      this.player.play(this.getJumpAnimation(), true);
    } else {
      this.scene.events.emit("reset");
    }
  };

  public checkpointReached = ([player, checkpoint]: [
    GameObjects.Sprite,
    GameObjects.Sprite
  ]) => {
    const checkpointX = checkpoint.getData("originPositionX");
    const checkpointY = checkpoint.getData("originPositionY");
    const newSpawnPoint = new Phaser.Math.Vector2(checkpointX, checkpointY);
    this.spawnPoint = newSpawnPoint;
  };

  public unlockPower2 = () => {
    this.hasPower[1] = true;
  };
}
