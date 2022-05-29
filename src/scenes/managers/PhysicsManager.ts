import { GameObjects } from "phaser";
import GameScene from "../../levels/Level1";

export default abstract class PhysicsManager {
  protected group!: Phaser.Physics.Arcade.Group;

  constructor(protected scene: GameScene, protected name: string) {
    this.group = this.scene.physics.add.group({
      name: name,
      allowGravity: false,
      immovable: true,
    });
  }
  public abstract addCollider: (
    collider: GameObjects.GameObject,
    colliderEventName: string,
    collidedEventName: string,
    colliderCallback: () => void,
    collidedCallback: () => void
  ) => void;

  protected abstract respawn: (sprite: GameObjects.Sprite) => void;
}
