import AbilityManager from "../scenes/managers/AbilityManager";
import EndLevelManager from "../scenes/managers/EndLevelManager";
import AbstractLevel from "./AbstractLevel";

export default class Level1 extends AbstractLevel {
  protected power1manager!: AbilityManager;

  constructor() {
    super("Level1");
  }

  public preloadLevelAssets = () => {
    this.mapKey = "map";
    this.load.tilemapTiledJSON("map", "assets/images/map1.json");
    this.load.image("power2", "assets/images/power2.png");
  };

  public override customSetupMap = () => {};

  public override customLevelManagers = () => {
    // Power 2
    this.abilityManager = this.abilityManager = new AbilityManager(
      this,
      "power2",
      this.playerManager.player
    );
    this.abilityManager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithPower2",
      "collideWithPlayer",
      this.playerManager.unlockPower2,
      this.abilityManager.collected
    );

    // End level
    this.endLevelManager = new EndLevelManager(
      this,
      "endLevel",
      this.playerManager.player
    );

    this.endLevelManager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithEndLevel",
      "collideWithPlayer",
      this.endLevel
    );
  };

  public endLevel = () => {
    this.scene.stop("Level1");
    this.scene.start("Level2");
  };
}
