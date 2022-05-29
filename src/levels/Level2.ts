import AbilityManager from "../scenes/managers/AbilityManager";
import EndLevelManager from "../scenes/managers/EndLevelManager";
import AbstractLevel from "./AbstractLevel";

export default class Level2 extends AbstractLevel {
  constructor() {
    super("Level2");
  }
  public override preloadLevelAssets = () => {
    this.mapKey = "map2";
    this.load.tilemapTiledJSON("map2", "assets/images/map2.json");
    this.load.image("power3", "assets/images/power3.png");
  };

  public override customSetupMap = () => {};

  public override customLevelManagers = () => {
    // Player already have power 2
    this.playerManager.unlockPower2();
    // Power 3
    this.abilityManager = this.abilityManager = new AbilityManager(
      this,
      "power3",
      this.playerManager.player
    );
    this.abilityManager.addCollider(
      this.playerManager.player.body.gameObject,
      "collideWithPower2",
      "collideWithPlayer",
      this.playerManager.unlockPower3,
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
    console.log("end game !");
  };
}
