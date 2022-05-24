import { Game, GameObjects } from "phaser";
import GameScene from "../Game";
import PhysicsManager from "./PhysicsManager";

export default class EnemyManager extends PhysicsManager {
  private enemyDetectRange: number;
  private enemySpeed: number;

  constructor(
    protected scene: GameScene,
    protected name: string,
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ) {
    super(scene, name);
    this.enemyDetectRange = 300;
    this.enemySpeed = 150;

    this.scene.map.getObjectLayer(this.name).objects.forEach((enemy) => {
      const enemyObject = this.scene.map?.createFromObjects(this.name, {
        key: "tilesetSprite",
        id: enemy.id,
        frame: 191,
      })[0] as Phaser.GameObjects.GameObject;

      // Add each enemy to the enemy group.
      this.group.add(enemyObject);
    });
  }

  public update = (): void => {
    this.group.children.each((enemy) => {
      if (
        Phaser.Math.Distance.BetweenPoints(
          enemy.body.position,
          this.player.body.position
        ) < this.enemyDetectRange
      ) {
        this.scene.physics.moveToObject(enemy, this.player, this.enemySpeed);
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
    colliderCallback: () => void,
    collidedCallback: ([]) => void
  ): void => {
    this.scene.physics.add.collider(
      collider,
      this.group,
      (collider, collided) => {
        collider.emit(colliderEventName);
        collided.emit(collidedEventName, collided);
      }
    );

    collider.addListener(colliderEventName, colliderCallback);
    this.group.children.each((enemy) => {
      enemy.setData("originPositionX", enemy.body.position.x);
      enemy.setData("originPositionY", enemy.body.position.y);
      enemy.addListener(collidedEventName, collidedCallback);
    });
  };

  public enemyHit = (enemy: GameObjects.Sprite): void => {
    enemy.setX(enemy.getData("originPositionX"));
    enemy.setY(enemy.getData("originPositionY"));
    enemy.body.setVelocity(0);
  };
}
