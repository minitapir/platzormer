import { GameObjects, Tilemaps } from "phaser";
import IInteraction from "../behaviors/IInteraction";
import DynamicComponent from "../components/DynamicComponent";

export default abstract class PhysicsManager {
  protected group!: Phaser.Physics.Arcade.Group;

  constructor(
    protected physics: Phaser.Physics.Arcade.ArcadePhysics,
    protected map: Tilemaps.Tilemap,
    protected name: string
  ) {
    this.group = this.physics.add.group({
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
