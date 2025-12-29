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
const STOP_EASE_MS = 520; // How fast a reel eases into the final stop position
const CTA_URL = "https://github.com/George-Paul97";
const JACKPOT_ID = "SEVEN";

class SlotScene extends Phaser.Scene {
    constructor() {
        super("Slot");
        this.isSpinning = false;
        this.spinBtn = null;
        this.reels = [];
        this.spinCount = 0;
        this.plan = null;
        this.coinValue = 0;
        this.winLine = null;
        this.endCard = null;

    }

    create() {
        this.drawBackground();

        this.add.text(WIDTH / 2, 170, "SLOT SKILL STOP", {
            fontFamily: "Arial",
            fontSize: "44px",
            color: "#E5E7EB",
            fontStyle: "bold",
        }).setOrigin(0.5);


        this.drawReelsFrame();

        // Create reels (static)
        for (let r = 0; r < REEL_COUNT; r++) {
            const x = REELS_LEFT_X + r * (WINDOW_W + REEL_GAP) + WINDOW_W / 2;
            const reel = this.createReel(r, x, CENTER_Y);
            this.reels.push(reel);
        }

        this.renderReels();
        this.add.text(WIDTH / 2, 230, "Tap SPIN, then STOP each reel", {
            fontFamily: "Arial",
            fontSize: "22px",
            color: "#9CA3AF",
        }).setOrigin(0.5);

        this.spinBtn = this.makeButton(WIDTH / 2, 1040, 300, 78, "SPIN", () => this.onSpin());
        this.winLine = this.add.rectangle(
            WIDTH / 2,
            CENTER_Y,
            REELS_TOTAL_W,
            SYMBOL_H,
            0x00ffcc,
            0.10
        );
        this.winLine.setVisible(false);

        this.endCard = this.createEndCard();

        this.coinsText = this.add.text(70, 290, `Coins: ${this.coinValue}`, {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#E5E7EB",
            fontStyle: "bold",
        });

        this.stopBtns = [];
        const stopY = 1135;

        for (let r = 0; r < REEL_COUNT; r++) {
            const reelX = this.reels[r].x;
            const btn = this.makeButton(reelX, stopY, 200, 62, "STOP", () => this.onStop(r));
            btn.setEnabled(false); // IMPORTANT: disable until spin starts
            this.stopBtns.push(btn);
        }


    }

    onStop(reelIndex, auto = false) {
        const reel = this.reels[reelIndex];
        if (!this.isSpinning) return;
        if (reel.state !== "SPINNING") return;

        // Disable this reel's STOP button immediately for tactile feedback
        this.stopBtns?.[reelIndex]?.setEnabled?.(false);

        // stop to a random symbol
        //const rand = Math.floor(Math.random() * reel.symbolOrder.length);
        const targetId = this.plan?.targets?.[reelIndex] || reel.symbolOrder[0];
        reel.targetSymbolId = targetId;

        const fromPos = reel.pos;
        const toPos = this.findNextCenterIndex(reel, targetId);


        reel.state = "STOPPING";

        // Stop any previous tween (safety)
        reel.stopTween?.stop?.();

        reel.stopTween = this.tweens.addCounter({
            from: fromPos,
            to: toPos,
            duration: STOP_EASE_MS + (auto ? 120 : 0),
            ease: "Cubic.Out",
            onUpdate: (tw) => {
                reel.pos = tw.getValue();
                this.renderReels();
            },
            onComplete: () => {
                reel.state = "STOPPED";
                // Snap to an integer position to remove floating drift
                reel.pos = Math.round(reel.pos);
                this.renderReels();
                this.checkAllStopped();
            }
        });
    }


    // Finds the next integer "center index" >= current position such that
    // the center symbol matches targetId.
    // We add +2 steps so the STOP always feels like it had momentum.
    findNextCenterIndex(reel, targetId) {
        const len = reel.symbolOrder.length;
        const cur = reel.pos;
        const start = Math.ceil(cur + 2);

        for (let k = 0; k < len * 6; k++) {
            const idx = start + k;
            const symId = reel.symbolOrder[(idx % len + len) % len];
            if (symId === targetId) return idx;
        }
        return start + 6;
    }

    checkAllStopped() {
        const allStopped = this.reels.every(r => r.state === "STOPPED");
        if (!allStopped) return;

        this.isSpinning = false;
        // deactivate `STOP` buttons after everything `stops`
        this.stopBtns?.forEach(b => b.setEnabled?.(false));

        // Evaluate the center row
        const centers = this.reels.map(r => this.getSymbolAtCenter(r));
        const isWin = centers.every(s => s && s.id === this.plan.winSymbolId);

        if (isWin) {
            this.onWin(centers[0]);
        } else {
            this.onNearMiss();
        }
    }

    onNearMiss() {
        // Simple “try again” feedback
        const msg = this.add.text(WIDTH / 2, 930, "So close! Try again 👀", {
            fontFamily: "Arial",
            fontSize: "34px",
            color: "#FBBF24",
            fontStyle: "bold",
        }).setOrigin(0.5);

        this.tweens.add({
            targets: msg,
            y: msg.y - 10,
            yoyo: true,
            repeat: 3,
            duration: 140,
            onComplete: () => msg.destroy(),
        });

        // Allow another spin
        this.spinBtn?.setEnabled?.(true);
    }

    onWin(winSymbol) {
        // highlight the win row 
        if (this.winLine) this.winLine.setVisible(true);


        const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55);

        const title = this.add.text(WIDTH / 2, 880, "BIG WIN!", {
            fontFamily: "Arial",
            fontSize: "64px",
            color: "#34D399",
            fontStyle: "bold",
        }).setOrigin(0.5);

        const subtitle = this.add.text(
            WIDTH / 2,
            950,
            `Matched ${winSymbol?.label ?? "?"} ${winSymbol?.label ?? "?"} ${winSymbol?.label ?? "?"}`,
            {
                fontFamily: "Arial",
                fontSize: "26px",
                color: "#E5E7EB",
            }
        ).setOrigin(0.5);

        // Basic coin count-up
        const gain = 250 + Math.floor(Math.random() * 100);
        const from = this.coinValue;
        const to = this.coinValue + gain;

        if (this.coinsText) {
            this.tweens.addCounter({
                from,
                to,
                duration: 900,
                ease: "Quad.Out",
                onUpdate: (tw) => {
                    this.coinValue = Math.floor(tw.getValue());
                    this.coinsText.setText(`Coins: ${this.coinValue}`);
                },
            });
        }

        this.cameras.main.shake(240, 0.007);

        // Cleanup + allow replay
        this.time.delayedCall(900, () => {
            overlay.destroy();
            title.destroy();
            subtitle.destroy();
            this.showEndCard(); 
            this.spinBtn?.setEnabled?.(true);
        });


    }

    createEndCard() {
        const c = this.add.container(WIDTH / 2, HEIGHT / 2);
        c.setVisible(false);
        c.alpha = 0;

        const panel = this.add.rectangle(0, 0, 640, 520, 0x0b1222, 0.96)
            .setStrokeStyle(3, 0x1f2937, 1);

        const title = this.add.text(0, -170, "Play Now", {
            fontFamily: "Arial",
            fontSize: "46px",
            color: "#E5E7EB",
            fontStyle: "bold",
            align: "center",
        }).setOrigin(0.5);

        const sub = this.add.text(0, -110, "Keep the wins coming", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#9CA3AF",
            align: "center",
        }).setOrigin(0.5);

        const openCTA = () => {
            // MRAID support for ad webviews
            if (window.mraid && typeof window.mraid.open === "function") {
                window.mraid.open(CTA_URL);
                return;
            }
            window.open(CTA_URL, "_blank", "noopener,noreferrer");
        };

        const cta = this.makeButton(0, 120, 360, 78, "PLAY NOW", openCTA);

        const note = this.add.text(0, 210, "Limited-time bonus • No download required", {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#6B7280",
            align: "center",
        }).setOrigin(0.5);

        c.add([panel, title, sub, cta.container, note]);
        c.titleText = title;
        c.subText = sub;

        // subtle float
        this.tweens.add({
            targets: c,
            y: c.y - 6,
            yoyo: true,
            repeat: -1,
            duration: 900,
            ease: "Sine.InOut",
        });

        return c;
    }

    showEndCard() {
        if (!this.endCard) return;

        this.endCard.setVisible(true);
        this.endCard.alpha = 0;

        this.tweens.add({
            targets: this.endCard,
            alpha: 1,
            duration: 260,
            ease: "Quad.Out",
        });
    }


    update(time, delta) {
        if (!this.isSpinning) return;
        const dt = delta / 1000;

        for (const reel of this.reels) {
            if (reel.state === "SPINNING") {
                reel.pos += SPIN_SPEED * dt;
            }
        }
        this.renderReels();
    }

    onSpin() {
        if (this.isSpinning) return;

        this.spinCount += 1;
        this.plan = this.makeOutcomePlan(this.spinCount);

        // Reset any win/end-card visuals for the new spin
        if (this.winLine) this.winLine.setVisible(false);
        if (this.endCard) { this.endCard.setVisible(false); this.endCard.alpha = 0; }


        // Enable STOP buttons and disable SPIN while spinning
        this.stopBtns?.forEach(b => b.setEnabled?.(true));
        this.spinBtn?.setEnabled?.(false);

        // Start spinning
        this.isSpinning = true;
        for (const reel of this.reels) {
            reel.state = "SPINNING";
            reel.targetSymbolId = null;
            reel.stopTween?.stop?.();
            reel.stopTween = null;
        }

        // Auto-stop fallback (if user doesn't press STOP)
        this.time.delayedCall(1600, () => { if (this.isSpinning) this.onStop(0, true); });
        this.time.delayedCall(2100, () => { if (this.isSpinning) this.onStop(1, true); });
        this.time.delayedCall(2550, () => { if (this.isSpinning) this.onStop(2, true); });
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
            targetSymbolId: null, // The symbol we want to land in the center row
            stopTween: null, // Tween reference for the easing stop animation  ,
            state: "STOPPED",

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

    getSymbolAtCenter(reel) {
        const len = reel.symbolOrder.length;
        const centerIndex = Math.round(reel.pos);
        const symId = reel.symbolOrder[(centerIndex % len + len) % len];
        return SYMBOLS.find(s => s.id === symId);
    }

    makeButton(x, y, w, h, label, onClick) {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, w, h, 0x2563eb, 1)
            .setStrokeStyle(3, 0x1d4ed8, 1);

        const txt = this.add.text(0, 0, label, {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#ffffff",
            fontStyle: "bold",
        }).setOrigin(0.5);

        container.add([bg, txt]);

        // Larger hit area (mobile/trackpad friendly)
        const hitPad = 14;
        const hitRect = new Phaser.Geom.Rectangle(
            -w / 2 - hitPad,
            -h / 2 - hitPad,
            w + hitPad * 2,
            h + hitPad * 2
        );

        bg.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);
        txt.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);

        const handler = () => {
            if (!container._enabled) return;
            this.tweens.add({ targets: container, scaleX: 0.97, scaleY: 0.97, yoyo: true, duration: 120 });
            onClick();
        };

        // pointerup is more forgiving than pointerdown
        bg.on("pointerup", handler);
        txt.on("pointerup", handler);

        const api = {
            container, bg, txt,
            setEnabled: (v) => {
                container._enabled = v;
                bg.setFillStyle(v ? 0x2563eb : 0x374151, 1);
                bg.setStrokeStyle(3, v ? 0x1d4ed8 : 0x1f2937, 1);
                txt.setAlpha(v ? 1 : 0.65);
                if (bg.input) bg.input.enabled = v;
                if (txt.input) txt.input.enabled = v;
            }
        };

        api.setEnabled(true);
        return api;
    }


    makeOutcomePlan(spinCount) {
        // Spin #1: near miss (two jackpots, one different)
        // Spin #2+: win (all jackpots)
        const winSymbolId = JACKPOT_ID;

        if (spinCount === 1) {
            return {
                type: "NEAR_MISS",
                winSymbolId,
                targets: [winSymbolId, winSymbolId, "STAR"],
            };
        }

        return {
            type: "WIN",
            winSymbolId,
            targets: [winSymbolId, winSymbolId, winSymbolId],
        };
    }


    renderReels() {
        for (const reel of this.reels) {
            const baseIndex = Math.round(reel.pos);
            const frac = reel.pos - baseIndex;
            const centerSlot = Math.floor(VISIBLE_SLOTS / 2); // 4

            for (let i = 0; i < reel.slots.length; i++) {
                const offset = i - centerSlot;          // -4..+4
                const symbolIndex = baseIndex + offset; // choose symbol
                const symId = reel.symbolOrder[(symbolIndex % reel.symbolOrder.length + reel.symbolOrder.length) % reel.symbolOrder.length];
                const sym = SYMBOLS.find(s => s.id === symId);

                const y = (WINDOW_H / 2) + (offset - frac) * SYMBOL_H;
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
