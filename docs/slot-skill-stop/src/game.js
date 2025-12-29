const WIDTH = 720;
const HEIGHT = 1280;

const SYMBOLS = [
    { id: "SEVEN", label: "7" },
    { id: "GEM", label: "💎" },
    { id: "STAR", label: "★" },
    { id: "COIN", label: "🪙" },
    { id: "HEART", label: "♥" },
    { id: "CLUB", label: "♣" },
];

// Reel visuals (static)
const REEL_COUNT = 3;
const SYMBOL_H = 150;
const VISIBLE_SLOTS = 9;          // -4..+4
const WINDOW_H = SYMBOL_H * 3;    // 3 rows visible
const WINDOW_W = 170;
const REEL_GAP = 22;

const REELS_TOTAL_W = (REEL_COUNT * WINDOW_W) + ((REEL_COUNT - 1) * REEL_GAP);
const REELS_LEFT_X = (WIDTH - REELS_TOTAL_W) / 2;
const CENTER_Y = 620;
const SPIN_SPEED = 18.0; // symbols per second

class SlotScene extends Phaser.Scene {
    constructor() {
        super("Slot");
        this.isSpinning = false;
        this.spinBtn = null;
        this.reels = [];
    }

    create() {
        this.drawBackground();

        this.add.text(WIDTH / 2, 170, "SLOT SKILL STOP", {
            fontFamily: "Arial",
            fontSize: "44px",
            color: "#E5E7EB",
            fontStyle: "bold",
        }).setOrigin(0.5);

        this.add.text(WIDTH / 2, 230, "Static reels (next: spin + stop)", {
            fontFamily: "Arial",
            fontSize: "22px",
            color: "#9CA3AF",
        }).setOrigin(0.5);

        this.drawReelsFrame();

        // Create reels (static)
        for (let r = 0; r < REEL_COUNT; r++) {
            const x = REELS_LEFT_X + r * (WINDOW_W + REEL_GAP) + WINDOW_W / 2;
            const reel = this.createReel(r, x, CENTER_Y);
            this.reels.push(reel);
        }

        this.renderReels();
        this.spinBtn = this.makeButton(WIDTH / 2, 1040, 300, 78, "SPIN", () => this.onSpin());

        this.stopBtns = [];
        const stopY = 1135;

        for (let r = 0; r < REEL_COUNT; r++) {
        const reelX = this.reels[r].x;
        const btn = this.makeButton(reelX, stopY, 200, 62, "STOP", () => this.onStop(r));
        // for now keep them active
        this.stopBtns.push(btn);
        }

    }

    onStop(reelIndex) {
        const reel = this.reels[reelIndex];
        if (!this.isSpinning) return;
        if (reel.state !== "SPINNING") return;

        reel.state = "STOPPED";

        const allStopped = this.reels.every(r => r.state === "STOPPED");
        if (allStopped) this.isSpinning = false;
    }


    update(time, delta) {
        if (!this.isSpinning) return;
        const dt = delta / 1000;
        for (const reel of this.reels) {
            if (reel.state === "SPINNING") reel.pos += SPIN_SPEED * dt;
        }

        this.renderReels();
    }

    onSpin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.reels.forEach(r => r.state = "SPINNING");
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

    createReel(index, x, centerY) {
        const order = this.makeSymbolOrder(index);

        const reel = {
            index,
            x,
            centerY,
            symbolOrder: order,
            pos: 0,
            slots: [],
        };

        const c = this.add.container(x - WINDOW_W / 2, centerY - WINDOW_H / 2);

        const bg = this.add.rectangle(WINDOW_W / 2, WINDOW_H / 2, WINDOW_W, WINDOW_H, 0x0b1222, 0.9)
            .setStrokeStyle(2, 0x111827, 1);
        c.add(bg);

        for (let i = 0; i < VISIBLE_SLOTS; i++) {
            const slot = this.createSymbolSlot(WINDOW_W / 2, WINDOW_H / 2, i);
            c.add(slot.container);
            reel.slots.push(slot);
        }

        // mask to window
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(x - WINDOW_W / 2, centerY - WINDOW_H / 2, WINDOW_W, WINDOW_H);
        c.setMask(maskShape.createGeometryMask());

        // border frame
        const frame = this.add.rectangle(x, centerY, WINDOW_W + 10, WINDOW_H + 10, 0x000000, 0);
        frame.setStrokeStyle(4, 0x1f2937, 1);

        return reel;
    }

    makeSymbolOrder(reelIndex) {
        const base = SYMBOLS.map(s => s.id);
        const arr = [...base, ...base, ...base]; // 18

        for (let i = 0; i < arr.length; i++) {
            const j = (i * 7 + reelIndex * 3) % arr.length;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    createSymbolSlot(x, y, slotIndex) {
        const cont = this.add.container(x, y);

        const rect = this.add.rectangle(0, 0, WINDOW_W - 18, SYMBOL_H - 16, 0x111827, 0.85)
            .setStrokeStyle(2, 0x0f172a, 1);
        cont.add(rect);

        const txt = this.add.text(0, 0, "?", {
            fontFamily: "Arial",
            fontSize: "64px",
            color: "#E5E7EB",
            fontStyle: "bold",
        }).setOrigin(0.5);
        cont.add(txt);

        const shine = this.add.rectangle(0, -18, WINDOW_W - 30, 18, 0xffffff, 0.06);
        cont.add(shine);

        return { container: cont, rect, txt, shine, slotIndex };
    }


    makeButton(x, y, w, h, label, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x2563eb, 1).setStrokeStyle(3, 0x1d4ed8, 1);
    const txt = this.add.text(0, 0, label, {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#ffffff",
        fontStyle: "bold",
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    container.on("pointerdown", () => {
        this.tweens.add({ targets: container, scaleX: 0.97, scaleY: 0.97, yoyo: true, duration: 120 });
        onClick();
    });

    return { container, bg, txt };
    }


    renderReels() {
        for (const reel of this.reels) {
            const baseIndex = Math.round(reel.pos);
            const centerSlot = Math.floor(VISIBLE_SLOTS / 2); // 4

            for (let i = 0; i < reel.slots.length; i++) {
                const offset = i - centerSlot;          // -4..+4
                const symbolIndex = baseIndex + offset; // choose symbol
                const symId = reel.symbolOrder[(symbolIndex % reel.symbolOrder.length + reel.symbolOrder.length) % reel.symbolOrder.length];
                const sym = SYMBOLS.find(s => s.id === symId);

                const y = (WINDOW_H / 2) + offset * SYMBOL_H;
                const slot = reel.slots[i];
                slot.container.y = y;
                slot.txt.setText(sym.label);

                if (offset === 0) {
                    slot.rect.setFillStyle(0x0f172a, 0.98);
                    slot.rect.setStrokeStyle(3, 0x22c55e, 0.9);
                } else {
                    slot.rect.setFillStyle(0x111827, 0.85);
                    slot.rect.setStrokeStyle(2, 0x0f172a, 1);
                }
            }
        }
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
