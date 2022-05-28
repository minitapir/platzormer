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
      .sprite(this.spawnPoint.x, this.spawnPoint.y, this.name)
      .setOrigin(0, 0);

    // Player settings
    this.playerSpeed = 300;
    this.canJump = true;
    this.jumpStrength = 450;
    this.jumpMax = 2;
    this.currentJumpCount = this.jumpMax;

    // Abilities
    this.abilitiesCount = 3;
    this.currentAbility = 0;
    this.abilityChangeDelay = 200;
    this.timeSinceLastAbilityChange = 0;
    this.hasPower = [true, false, false]; // By default, has only climb power

    // Animations
    const characters = ["yellow", "purple", "blue"];
    characters.forEach((character, index) =>
      this.scene.anims.create({
        key: character,
        frames: [{ key: "player", frame: index }],
        frameRate: 20,
      })
    );
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
      //si Z est appuyé, que la var jump est encore utilisable et que le joueur peut sauter,
      //alors il a le droit à un autre saut et saute
      this.currentJumpCount--;
      this.canJump = false;
      this.player.setVelocityY(-this.jumpStrength);
    }
    if (this.scene.getControl("jump")?.control.isUp) {
      //lorsque la touche Z n'est plus appuyée, alors il remplit une des conditions pour sauter de nouveau
      this.canJump = true;
    }
  };

  private terminalVelocityCheck = (): void => {
    if (this.player.body.velocity.y > 800) {
      this.player.setVelocityY(800);
    }
  };

  private setVelocity = (): void => {
    if (this.scene.getControl("left")?.control.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (this.scene.getControl("right")?.control.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }
    this.player.anims.play("yellow");
    this.terminalVelocityCheck();
  };

  // Abilities
  private handleAbility = (delta: number): void => {
    this.timeSinceLastAbilityChange += delta;
    if (this.scene.getControl("action")?.control.isDown) {
      this.nextAbility();
    }

    if (this.currentAbility === 0) {
      this.player.anims.play("yellow");
    }

    if (this.currentAbility === 1) {
      this.player.anims.play("blue");

      this.playerSpeed = 500;
      this.jumpMax = 2;
      this.jumpStrength = 500;
    } else {
      this.playerSpeed = 300;
      this.jumpMax = 1;
      this.jumpStrength = 450;
    }

    if (this.currentAbility === 2) {
      this.player.anims.play("purple");
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
  public override respawn = (): void => {
    this.currentAbility = 0;
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
    if (enemy.body.touching.up && this.currentAbility === 2) {
      this.player.setVelocityY(-this.jumpStrength*1.5);
    } else {
      this.respawn();
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

  public unlockPower3 = () => {
    this.hasPower[2] = true;
  };
}
