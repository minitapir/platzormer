import { GameObjects } from "phaser";
import GameScene from "../../levels/Level1";
import PhysicsManager from "./PhysicsManager";

export default class PlayerManager extends PhysicsManager {
  public player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private spawnPoint: Phaser.Math.Vector2;
  public playerSpeed: integer;
  public canJump: boolean;
  public currentJumpCount: integer;
  public jumpMax: integer;
  public jumpStrength: integer;

  // Abilities variables
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

  private nextAbility = () => {
    if (this.timeSinceLastAbilityChange >= this.abilityChangeDelay) {
      this.currentAbility++;
      if (this.currentAbility === this.abilitiesCount) {
        this.currentAbility = 0;
      }
      this.timeSinceLastAbilityChange = 0;
    }
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
      this.player.setVelocityY(-this.jumpStrength);
    } else {
      this.respawn();
    }
  };

  public checkpointReached = () => {
    console.log("checkpoint reached");
  };

  public power2Collected = () => {
    console.log("power2 collected");
  };
}
