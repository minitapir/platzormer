import { Vector } from "matter";
import { Tilemaps } from "phaser";

export default abstract class GameObjectComponent {
  public abstract create: (
    layer: string,
    id: number,
    sprite: string,
    position: Phaser.Math.Vector2 | Vector
  ) => void;

  constructor(
    protected physics: Phaser.Physics.Arcade.ArcadePhysics,
    protected map: Tilemaps.Tilemap
  ) {}
}
