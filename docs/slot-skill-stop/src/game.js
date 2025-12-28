const WIDTH = 720;
const HEIGHT = 1280;

// Layout constants (frame only for now)
const REEL_COUNT = 3;
const SYMBOL_H = 150;
const WINDOW_H = SYMBOL_H * 3; // 3 rows visible
const WINDOW_W = 170;
const REEL_GAP = 22;

const REELS_TOTAL_W = (REEL_COUNT * WINDOW_W) + ((REEL_COUNT - 1) * REEL_GAP);
const CENTER_Y = 620;

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

    this.drawReelsFrame();
  }

  drawBackground() {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x070a12, 1);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2 - 220, WIDTH, HEIGHT / 2, 0x0b1530, 0.45);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 260, WIDTH, HEIGHT / 2, 0x0b1020, 0.65);

    const glow = this.add.circle(WIDTH / 2, 430, 260, 0x2563eb, 0.12);
    this.tweens.add({ targets: glow, alpha: 0.06, yoyo: true, repeat: -1, duration: 1200 });
  }

  drawReelsFrame() {
    const panelW = REELS_TOTAL_W + 56;

    this.add.rectangle(WIDTH / 2, CENTER_Y, panelW, 520, 0x000000, 0.22)
      .setStrokeStyle(2, 0x1f2937, 1);

    const l = this.add.rectangle(WIDTH / 2 - (panelW / 2 + 5), CENTER_Y, 10, 500, 0x22c55e, 0.08);
    const r = this.add.rectangle(WIDTH / 2 + (panelW / 2 + 5), CENTER_Y, 10, 500, 0x22c55e, 0.08);

    this.tweens.add({ targets: [l, r], alpha: 0.14, yoyo: true, repeat: -1, duration: 900 });
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
