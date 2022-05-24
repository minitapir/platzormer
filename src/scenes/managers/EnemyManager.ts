import { GameObjects, Tilemaps } from "phaser";
import IInteraction from "../behaviors/IInteraction";
import PhysicsManager from "./PhysicsManager";

export default class EnemyManager extends PhysicsManager {
  private enemyDetectRange: number;
  private enemySpeed: number;

  constructor(
    protected physics: Phaser.Physics.Arcade.ArcadePhysics,
    protected map: Tilemaps.Tilemap,
    protected name: string,
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ) {
    super(physics, map, name);
    this.enemyDetectRange = 300;
    this.enemySpeed = 150;

    this.map.getObjectLayer(this.name).objects.forEach((enemy) => {
      const enemyObject = this.map?.createFromObjects(this.name, {
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
        this.physics.moveToObject(enemy, this.player, this.enemySpeed);
      } else {
        enemy.body.setVelocity(
          Math.max(enemy.body.velocity.x - 0.5, 0),
          Math.max(enemy.body.velocity.y - 0.5, 0)
        );
      }
    });
  };

  public addCollision = (
    collider: GameObjects.GameObject,
    behavior: IInteraction
  ): void => {
    this.physics.add.collider(collider, this.group, behavior.onInteraction);
  };
}
