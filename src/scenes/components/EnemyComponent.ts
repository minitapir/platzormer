import { Vector } from "matter";
import DynamicComponent from "./DynamicComponent";

export default class EnemyComponent extends DynamicComponent {
  public create = (
    layer: string,
    id: number,
    sprite: string,
    position: Phaser.Math.Vector2 | Vector
  ): EnemyComponent => {
    console.log("het");
    return this;
  };
}
