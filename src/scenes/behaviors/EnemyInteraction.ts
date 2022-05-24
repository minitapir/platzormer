import IInteraction from "./IInteraction";

export default class EnemyInteraction implements IInteraction {
  onInteraction = (
    collider: Phaser.GameObjects.GameObject,
    collided: Phaser.GameObjects.GameObject
  ): void => {};
}
