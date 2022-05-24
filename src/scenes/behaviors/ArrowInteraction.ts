import IInteraction from "./IInteraction";

export default class ArrowInteraction implements IInteraction {
  onInteraction = (
    collider: Phaser.GameObjects.GameObject,
    collided: Phaser.GameObjects.GameObject
  ): void => {};
}
