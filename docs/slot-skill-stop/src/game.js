const WIDTH = 720;
const HEIGHT = 1280;

class SlotScene extends Phaser.Scene {
  constructor() { super("Slot"); }
  create() {
    this.add.rectangle(WIDTH/2, HEIGHT/2, WIDTH, HEIGHT, 0x070A12, 1);
    this.add.text(WIDTH/2, 170, "SLOT SKILL STOP", {
      fontFamily:"Arial", fontSize:"44px", color:"#E5E7EB", fontStyle:"bold"
    }).setOrigin(0.5);
    this.add.text(WIDTH/2, 230, "Scaffold", {
      fontFamily:"Arial", fontSize:"22px", color:"#9CA3AF"
    }).setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WIDTH,
  height: HEIGHT,
  scene: [SlotScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
