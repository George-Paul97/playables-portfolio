const WIDTH = 720;
const HEIGHT = 1280;

class SlotScene extends Phaser.Scene {
  constructor() {
    super("Slot");
  }

  create() {
    this.drawBackground();

    this.add.text(WIDTH / 2, 170, "SLOT SKILL STOP", {
      fontFamily: "Arial",
      fontSize: "44px",
      color: "#E5E7EB",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 230, "Scaffold", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#9CA3AF",
    }).setOrigin(0.5);
  }

  drawBackground() {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x070a12, 1);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2 - 220, WIDTH, HEIGHT / 2, 0x0b1530, 0.45);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 260, WIDTH, HEIGHT / 2, 0x0b1020, 0.65);

    const glow = this.add.circle(WIDTH / 2, 430, 260, 0x2563eb, 0.12);
    this.tweens.add({ targets: glow, alpha: 0.06, yoyo: true, repeat: -1, duration: 1200 });
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
