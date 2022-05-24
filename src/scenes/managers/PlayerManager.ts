import { GameObjects } from "phaser";
import GameScene from "../Game";
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

  public update = (): void => {
    this.setVelocity();
    this.handleJump();
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

  private setVelocity = (): void => {
    if (this.scene.getControl("left")?.control.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (this.scene.getControl("right")?.control.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }
    this.player.anims.play("yellow");
  };

  /**
   * When player is hit, reset.
   */
  public playerHit = (): void => {
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

  public timeBonusCollected = () => {
    console.log("just hit the bonus");
  };

  public win = () => {
    console.log("you just won!");
  };

  public checkpointReached = () => {
    console.log("checkpoint reached");
  };

  public power2Collected = () => {
    console.log("power2 collected");
  };
}
