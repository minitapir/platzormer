import { GameObjects, Tilemaps } from "phaser";
import IInteraction from "../behaviors/IInteraction";
import DynamicComponent from "../components/DynamicComponent";
import GameScene from "../Game";

export default abstract class PhysicsManager {
  protected group!: Phaser.Physics.Arcade.Group;

  constructor(protected scene: GameScene, protected name: string) {
    this.group = this.scene.physics.add.group({
      name: name,
      allowGravity: false,
      immovable: true,
    });
  }
  public abstract addCollision: (
    collider: GameObjects.GameObject,
    behavior: IInteraction
  ) => void;
}
