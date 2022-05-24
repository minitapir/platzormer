import DynamicComponent from "../components/DynamicComponent";

export default abstract class PhysicsManager {
  constructor(
    protected physics: Phaser.Physics.Arcade.ArcadePhysics,
    name: string
  ) {
    this.physics.add.group({
      name: name,
      allowGravity: false,
      immovable: true,
    });
  }
  public abstract add: (dynamicComponent: DynamicComponent) => void;
}
