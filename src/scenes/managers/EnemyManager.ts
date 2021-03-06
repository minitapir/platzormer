import { Game, GameObjects } from "phaser";
import GameScene from "../../levels/Level1";
import PhysicsManager from "./PhysicsManager";
import PlayerManager from "./PlayerManager";

export default class EnemyManager extends PhysicsManager {
  private enemyDetectRange: number;
  private enemySpeed: number;

  constructor(
    protected scene: GameScene,
    protected name: string,
    private playerManager: PlayerManager
  ) {
    super(scene, name);
    this.enemyDetectRange = 300;
    this.enemySpeed = 100;

    const enemiesSpawnPoints = this.scene.map
      .getObjectLayer(this.name)
      .objects.forEach((enemy) => {
        const enemyObject = this.scene.physics.add
          .sprite(enemy.x as number, enemy.y as number, this.name)
          .setOrigin(0, 0);
        // Add each enemy to the enemy group.
        this.group.add(enemyObject);
        enemyObject.addListener("respawn", this.respawn);
      });
  }

  public update = (delta: number): void => {
    this.group.children.each((enemy) => {
      if (
        Phaser.Math.Distance.BetweenPoints(
          enemy.body.position,
          this.playerManager.player.body.position
        ) < this.enemyDetectRange
      ) {
        this.scene.physics.moveToObject(
          enemy,
          this.playerManager.player,
          this.enemySpeed
        );
        if (enemy.body.position.x > this.playerManager.player.body.position.x) {
          enemy.setFlipX(false);
        } else {
          enemy.setFlipX(true);
        }
      } else {
        enemy.body.setVelocity(
          Math.max(enemy.body.velocity.x - 0.5, 0),
          Math.max(enemy.body.velocity.y - 0.5, 0)
        );
      }
    });
  };

  public addCollider = (
    collider: GameObjects.GameObject,
    colliderEventName: string,
    collidedEventName: string,
    colliderCallback: ([]) => void,
    collidedCallback: ([]) => void
  ): void => {
    this.scene.physics.add.collider(
      collider,
      this.group,
      (collider, collided) => {
        collider.emit(colliderEventName, [collider, collided]);
        collided.emit(collidedEventName, [collider, collided]);
      }
    );

    collider.addListener(colliderEventName, colliderCallback);
    this.group.children.each((enemy) => {
      enemy.setData("originPositionX", enemy.body.position.x);
      enemy.setData("originPositionY", enemy.body.position.y);
      enemy.addListener(collidedEventName, collidedCallback);
    });
  };

  /**
   * When ghost hits the player, if the player is above and has the correct ability, the ghost is killed.
   */
  public handleCollisionWithPlayer = ([player, enemy]: [
    GameObjects.Sprite,
    GameObjects.Sprite
  ]): void => {
    if (enemy.body.touching.up) {
      enemy.destroy();
    } else {
      // Reset is called by player event handler
    }
  };

  public respawnAll = () => {
    this.group.children.each((enemy) => {
      enemy.emit("respawn", enemy);
    });
  };

  protected override respawn = (enemy: GameObjects.Sprite): void => {
    enemy.setX(enemy.getData("originPositionX"));
    enemy.setY(enemy.getData("originPositionY"));
    enemy.body.setVelocity(0);
  };
}
