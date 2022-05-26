import { Game, GameObjects } from "phaser";
import GameScene from "../../levels/Level1";
import PhysicsManager from "./PhysicsManager";

export default class Ability2Manager extends PhysicsManager {
  constructor(
    protected scene: GameScene,
    protected name: string,
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ) {
    super(scene, name);

    const spawnPoints = this.scene.map
      .getObjectLayer(this.name)
      .objects.forEach((objectTile) => {
        const object = this.scene.physics.add
          .sprite(objectTile.x as number, objectTile.y as number, this.name)
          .setOrigin(0, 1)
          .setDisplaySize(64, 64)
        // Add each object to the enemy group.
        this.group.add(object);
      });
  }

  public update = (): void => {
    // CA CHILL
  };

  public addCollider = (
    collider: GameObjects.GameObject,
    colliderEventName: string,
    collidedEventName: string,
    colliderCallback: () => void,
    collidedCallback: ([]) => void
  ): void => {
    this.scene.physics.add.overlap(
      collider,
      this.group,
      (collider, collided) => {
        collider.emit(colliderEventName);
        collided.emit(collidedEventName, collided);
      }
    );

    collider.addListener(colliderEventName, colliderCallback);
    this.group.children.each((child) => {
      child.setData("originPositionX", child.body.position.x);
      child.setData("originPositionY", child.body.position.y);
      child.addListener(collidedEventName, collidedCallback);
    });
  };

  public collected = (item: GameObjects.Sprite) => {
    item.destroy();
  };
}
