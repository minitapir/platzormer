import { GameObjects } from "phaser";

export default interface IInteraction {
  onInteraction: (
    collider: GameObjects.GameObject,
    collided: GameObjects.GameObject
  ) => void;
}
