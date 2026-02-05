import Phaser from 'phaser';

import { DataKeys, SceneKeys, TextureKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants';
import { GameUtils } from '../utils/GameUtils';
import { IdleManager } from '../utils/IdleManager';
import { PaintManager } from '../utils/PaintManager';
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation';
import AudioManager from '../audio/AudioManager';
import { game } from "@iruka-edu/mini-game-sdk";
import { sdk } from '../main';

export default class Scene2 extends Phaser.Scene {
    private paintManager!: PaintManager;
    private idleManager!: IdleManager;

    private unfinishedPartsMap: Map<string, Phaser.GameObjects.Image> = new Map();
    private finishedParts: Set<string> = new Set();
    private totalParts: number = 0;
    private isIntroActive: boolean = false;

    private paletteButtons: Phaser.GameObjects.Image[] = [];
    private handHint!: Phaser.GameObjects.Image;
    private firstColorBtn!: Phaser.GameObjects.Image;

    private activeHintTween: Phaser.Tweens.Tween | null = null;

    private readonly PALETTE_DATA = [
        { key: TextureKeys.BtnRed, color: 0xFF595E },
        { key: TextureKeys.BtnYellow, color: 0xFFCA3A },
        { key: TextureKeys.BtnGreen, color: 0x8AC926 },
        { key: TextureKeys.BtnBlue, color: 0x1982C4 },
        { key: TextureKeys.BtnPurple, color: 0x6A4C93 },
        { key: TextureKeys.BtnCream, color: 0xFDFCDC },
        { key: TextureKeys.BtnBlack, color: 0x000000 }
    ];

    constructor() { super(SceneKeys.Scene2); }

    init() {
        this.unfinishedPartsMap.clear();
        this.finishedParts.clear();
        this.totalParts = 0;
        this.paletteButtons = [];
    }

    create() {
        this.setupSystem();
        this.createUI();
        this.createLevel();

        // SDK Integration: Set Total & Init State
        game.setTotal(this.totalParts);
        (window as any).irukaGameState = {
            startTime: Date.now(),
            currentScore: 0,
        };
        sdk.score(0, 0); // initial score
        sdk.progress({ levelIndex: 1, total: 2 }); // Level 2 (index 1) of 2

        game.startQuestionTimer();

        this.setupInput();
        this.playIntroSequence();
        // this.debugShowAllHints();
        // this.debugShowAllOffsets();
        this.events.on('wake', () => {
            this.idleManager.reset();
            if (this.input.keyboard) this.input.keyboard.enabled = true;
        });
    }

    update(time: number, delta: number) {
        if (!this.paintManager.isPainting() && !this.isIntroActive && this.finishedParts.size < this.totalParts) {
            this.idleManager.update(delta);
        }
    }

    shutdown() {
        this.stopIntro();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.paintManager = null as any;
    }

    private setupSystem() {
        resetVoiceState();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gameScene = this;
        setGameSceneReference(this);

        this.paintManager = new PaintManager(this, (id, rt, usedColors) => {
            this.handlePartComplete(id, rt, usedColors);
        });

        this.paintManager.setColor(this.PALETTE_DATA[0].color);

        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => {
            console.log("Idle Manager Triggered!"); // Debug log
            this.showHint();
        });
    }

    // ... (rest of setupInput, createUI, etc. - skipping unchanged parts to find stopIntro)


    private setupInput() {
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.paintManager.handlePointerMove(p));
        this.input.on('pointerup', () => this.paintManager.handlePointerUp());

        this.input.on('pointerdown', () => {
            this.idleManager.reset();
            this.stopIntro();
        });
    }

    private createUI() {
        const UI = GameConstants.SCENE2.UI;
        const cx = GameUtils.pctX(this, 0.5);

        const bannerY = GameUtils.pctY(this, UI.BANNER_Y);
        const bannerScale = (UI as any).BANNER_SCALE ?? 0.75;
        const banner = this.add.image(cx, bannerY, TextureKeys.S2_Banner).setOrigin(0.5, 0).setScale(bannerScale);

        const textY = bannerY + banner.displayHeight / 2;
        this.add.image(cx, textY, TextureKeys.S2_TextBanner).setScale(bannerScale);

        const boardY = banner.displayHeight + GameUtils.pctY(this, UI.BOARD_OFFSET);
        const boardScale = (UI as any).BOARD_SCALE ?? 0.75;
        const boardRight = this.add.image(cx, boardY, TextureKeys.S2_Rectangle1).setOrigin(0.5, 0).setScale(boardScale);

        // Goal net shifted to left side
        // const goalX = GameUtils.getW(this) * 0.14;
        // const goalY = boardY + GameUtils.pctY(this, 0.08);
        // this.add.image(goalX, goalY, TextureKeys.S2_goal).setOrigin(0, 0).setScale(boardScale);

        // Character (Left)
        const charX = cx - boardRight.displayWidth * 0.25;
        const charY = boardY + boardRight.displayHeight * 0.1;
        this.add.image(charX, charY, TextureKeys.S2_Layer1).setOrigin(0.5, 0).setScale(boardScale * 0.9);

        // Letter U (Right)
        const uwX = cx + boardRight.displayWidth * 0.25;
        const uwY = boardY + boardRight.displayHeight * 0.15;
        this.add.image(uwX, uwY, TextureKeys.S2_UW).setOrigin(0.5, 0).setScale(boardScale * 0.9);

        // Text "cô cấp dưỡng" (Bottom Center)
        // const textResultY = boardY + boardRight.displayHeight * 0.75;
        // this.add.image(cx, textResultY, TextureKeys.S2_Frame76).setOrigin(0.5, 0).setScale(boardScale * 0.8);

        this.createPalette();

        this.handHint = this.add.image(0, 0, TextureKeys.HandHint).setDepth(200).setAlpha(0).setScale(0.7);
    }

    private createPalette() {
        const UI = GameConstants.SCENE2.UI;
        const spacing = GameUtils.pctX(this, UI.PALETTE_SPACING);
        const yPos = GameUtils.pctY(this, UI.PALETTE_Y);
        const totalItems = this.PALETTE_DATA.length + 1;
        const startX = (GameUtils.getW(this) - (totalItems - 1) * spacing) / 2;

        this.PALETTE_DATA.forEach((item, i) => {
            const btnX = startX + (i * spacing);
            const btn = this.add.image(btnX, yPos, item.key).setInteractive();

            const btnScale = (UI as any).PALETTE_BTN_SCALE ?? 0.65;
            if (i === 0) {
                this.firstColorBtn = btn;
                btn.setScale(btnScale * 1.2).setAlpha(1);
            } else {
                btn.setAlpha(0.9).setScale(btnScale);
            }

            btn.on('pointerdown', () => {
                this.updatePaletteVisuals(btn);
                this.paintManager.setColor(item.color);
            });
            this.paletteButtons.push(btn);
        });

        const eraserX = startX + (this.PALETTE_DATA.length * spacing);
        const btnScale = (UI as any).PALETTE_BTN_SCALE ?? 0.65;
        const eraser = this.add.image(eraserX, yPos, TextureKeys.BtnEraser).setInteractive().setAlpha(0.9).setScale(btnScale);
        eraser.on('pointerdown', () => {
            this.updatePaletteVisuals(eraser);
            this.paintManager.setEraser();
        });
        this.paletteButtons.push(eraser);
    }

    private updatePaletteVisuals(activeBtn: Phaser.GameObjects.Image) {
        const UI = GameConstants.SCENE2.UI;
        const btnScale = (UI as any).PALETTE_BTN_SCALE ?? 0.65;
        this.paletteButtons.forEach(b => b.setScale(btnScale).setAlpha(0.9));
        activeBtn.setScale(btnScale * 1.2).setAlpha(1);
    }

    private createLevel() {
        const data = this.cache.json.get(DataKeys.LevelS2Config);
        console.log("Level Data:", data); // Debug log

        if (data) {
            if (data.goalkeeper && data.goalkeeper.parts) {
                this.spawnParts(data.goalkeeper.parts, data.goalkeeper.baseX_pct, data.goalkeeper.baseY_pct);
            }
            if (data.letter && data.letter.parts) {
                this.spawnParts(data.letter.parts, data.letter.baseX_pct, data.letter.baseY_pct);
            }
            // Fallback for flat structure if needed
            if (data.parts) {
                this.spawnParts(data.parts);
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private spawnParts(parts: any[], baseXPct: number = 0.5, baseYPct: number = 0.5) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parts.forEach((part: any, index: number) => {
            const id = part.id || `${part.key}_${index}`;

            const cx = GameUtils.getW(this) * baseXPct;
            const cy = GameUtils.getH(this) * baseYPct;

            // Updated to match flat JSON structure (offsetX, offsetY)
            const layerX = cx + (part.offsetX || 0);
            const layerY = cy + (part.offsetY || 0);

            const scaleAdjust = part.scaleAdjust !== undefined ? part.scaleAdjust : 1;
            const scale = part.scale || 1.0;

            // Note: PaintManager.createPaintableLayer expects (x, y, key, scale, id, scaleAdjust)
            const hitArea = this.paintManager.createPaintableLayer(layerX, layerY, part.key, scale, id, scaleAdjust);

            // Updated to match flat JSON structure (hintX, hintY)
            hitArea.setData('hintX', part.hintX || 0);
            hitArea.setData('hintY', part.hintY || 0);
            hitArea.setData('originScale', scale);
            hitArea.setData('baseX', cx);
            hitArea.setData('baseY', cy);
            hitArea.setData('partKey', part.key);
            hitArea.setData('partId', id);

            this.unfinishedPartsMap.set(id, hitArea);
            this.totalParts++;

            // Enable Debug Mode for this part
            hitArea.setInteractive();
            hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.rightButtonDown()) { // Right click to debug
                    this.enableHintDebug(hitArea);
                }
            });
        });

        // Key P to dump config
        this.input.keyboard?.on('keydown-P', () => {
            this.dumpDebugConfig();
        });
    }

    private enableHintDebug(target: Phaser.GameObjects.Image) {
        console.log(`[DEBUG] Selected part: ${target.getData('partId')}`);
        this.logHintTarget(target);

        // Show hand at current hint pos (Global offset from center)
        const hX = target.getData('hintX');
        const hY = target.getData('hintY');
        const cx = target.getData('baseX');
        const cy = target.getData('baseY');

        const worldX = cx + hX;
        const worldY = cy + hY;

        this.handHint.setPosition(worldX, worldY).setAlpha(1).setScale(0.7).setDepth(300);

        // Enable drag on hand
        this.handHint.setInteractive({ draggable: true });
        this.input.setDraggable(this.handHint);

        this.handHint.off('drag');
        this.handHint.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            this.handHint.setPosition(dragX, dragY);

            // Calculate new relative hint position (Global offset from center)
            const newHintX = Math.round(dragX - cx);
            const newHintY = Math.round(dragY - cy);

            console.log(`Hint Pos: x=${newHintX}, y=${newHintY}`);
            target.setData('hintX', newHintX);
            target.setData('hintY', newHintY);
        });
    }

    private dumpDebugConfig() {
        console.log("===== GENERATING CONFIG JSON =====");

        // Deep clone the full config to preserve structure
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fullConfig = JSON.parse(JSON.stringify(this.cache.json.get(DataKeys.LevelS2Config)));

        this.unfinishedPartsMap.forEach((hitArea) => {
            const id = hitArea.getData('partId');
            const key = hitArea.getData('partKey');

            const hintX = hitArea.getData('hintX');
            const hintY = hitArea.getData('hintY');
            const cx = hitArea.getData('baseX');
            const cy = hitArea.getData('baseY');

            const offsetX = Math.round(hitArea.x - cx);
            const offsetY = Math.round(hitArea.y - cy);

            // Find in goalkeeper
            let found = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (fullConfig.goalkeeper && fullConfig.goalkeeper.parts) {
                const p = fullConfig.goalkeeper.parts.find((item: any) => {
                    return (item.id === id) || (item.key === key);
                });

                if (p) {
                    p.offsetX = offsetX;
                    p.offsetY = offsetY;
                    p.hintX = hintX;
                    p.hintY = hintY;
                    found = true;
                }
            }

            // Find in letter (if not found in goalkeeper, or checking both?)
            if (!found && fullConfig.letter && fullConfig.letter.parts) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = fullConfig.letter.parts.find((item: any) => {
                    return (item.id === id) || (item.key === key);
                });
                if (p) {
                    p.offsetX = offsetX;
                    p.offsetY = offsetY;
                    p.hintX = hintX;
                    p.hintY = hintY;
                    found = true;
                }
            }
        });

        console.log(JSON.stringify(fullConfig, null, 2));
    }

    private handlePartComplete(id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) {
        this.finishedParts.add(id);

        // SDK: Record Correct & Update Score
        game.recordCorrect({ scoreDelta: 1 });
        if ((window as any).irukaGameState) {
            (window as any).irukaGameState.currentScore = this.finishedParts.size;
        }
        sdk.score(this.finishedParts.size, 1);
        sdk.progress({
            levelIndex: 1,
            score: this.finishedParts.size,
        });

        if (usedColors.size === 1) {
            const singleColor = usedColors.values().next().value || 0;

            rt.setBlendMode(Phaser.BlendModes.NORMAL);
            rt.fill(singleColor);
        } else {
            console.log("Multi-color artwork preserved!");
        }

        this.unfinishedPartsMap.delete(id);

        AudioManager.play('sfx-ting');

        this.tweens.add({ targets: rt, alpha: 0.8, yoyo: true, duration: GameConstants.SCENE2.TIMING.AUTO_FILL, repeat: 2 });

        if (this.finishedParts.size >= this.totalParts) {
            console.log("WIN!");

            // SDK: Level Complete
            game.finishQuestionTimer();
            game.finalizeAttempt();
            sdk.requestSave({
                score: this.finishedParts.size,
                levelIndex: 1,
            });
            sdk.progress({
                levelIndex: 1, // Current level completed
                total: 2,
                score: this.finishedParts.size,
            });

            AudioManager.play('sfx-correct_s2');
            this.time.delayedCall(GameConstants.SCENE2.TIMING.WIN_DELAY, () => this.scene.start(SceneKeys.EndGame));
        } else {
            // SDK: Part Complete (Sub-task)
            game.finishQuestionTimer();
            // Start timer for next part
            game.startQuestionTimer();
        }
    }

    public restartIntro() {
        this.stopIntro();
        this.time.delayedCall(GameConstants.SCENE2.TIMING.RESTART_INTRO, () => this.playIntroSequence());
    }

    private playIntroSequence() {
        this.isIntroActive = true;
        playVoiceLocked(null, 'voice_intro_s2');
        this.time.delayedCall(GameConstants.SCENE2.TIMING.INTRO_DELAY, () => { if (this.isIntroActive) this.runHandTutorial(); });
    }

    private stopIntro() {
        if (this.isIntroActive) {
            console.log("[DEBUG] stopIntro called - Intro ending, Idle starting.");
        }
        this.isIntroActive = false;
        this.idleManager.start();
        this.tweens.killTweensOf(this.handHint);
        this.handHint.setAlpha(0).setPosition(-200, -200);
    }

    private runHandTutorial() {
        if (!this.firstColorBtn || !this.isIntroActive) {
            console.warn("[INTRO] Aborting - firstColorBtn missing or Intro inactive");
            return;
        }

        const UI = GameConstants.SCENE2.UI;
        const INTRO = GameConstants.SCENE2.INTRO_HAND;

        console.log("%c[INTRO] Playing Hand Tutorial Sequence", "color: #e6007e; font-weight: bold;");

        const startX = this.firstColorBtn.x + 20;
        const startY = this.firstColorBtn.y + 20;
        const endX = GameUtils.pctX(this, UI.HAND_INTRO_END_X);
        const endY = GameUtils.pctY(this, UI.HAND_INTRO_END_Y);
        const dragY = endY + 100;

        console.log(`[INTRO] Coordinates: Start(${startX}, ${startY}) -> End(${endX}, ${endY})`);

        if (!this.handHint) {
            console.error("[INTRO] FATAL: handHint is UNDEFINED!");
            return;
        }

        this.handHint.setPosition(startX, startY).setAlpha(0).setScale(0.7).setFlipX(false);

        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: startX, y: startY, duration: INTRO.MOVE, ease: 'Power2' },
                { scale: 0.5, duration: INTRO.TAP, yoyo: true, repeat: 0.7 },
                { x: endX, y: dragY, duration: INTRO.DRAG, delay: 100 },
                { x: '-=30', y: '-=10', duration: INTRO.RUB, yoyo: true, repeat: 3 },
                {
                    alpha: 0, duration: 500, onComplete: () => {
                        this.handHint.setPosition(-200, -200);
                        if (this.isIntroActive) this.time.delayedCall(1000, () => this.runHandTutorial());
                    }
                }
            ]
        });
    }

    private logHintTarget(target: Phaser.GameObjects.Image) {
        const id = target.getData('partId');
        console.log(`%c[HINT] Hand is pointing to: ${id}`, "color: #e6007e; font-weight: bold; font-size: 14px;");
    }

    private showHint() {
        const items = Array.from(this.unfinishedPartsMap.values());
        if (items.length === 0) return;

        const target = items[Math.floor(Math.random() * items.length)];
        this.logHintTarget(target);

        AudioManager.play('hint');
        game.addHint();

        const IDLE_CFG = GameConstants.IDLE;

        this.activeHintTween = this.tweens.add({
            targets: target, alpha: { from: 0.01, to: 0.3 },
            scale: { from: target.getData('originScale'), to: target.getData('originScale') * 1.01 },
            duration: IDLE_CFG.FADE_IN, yoyo: true, repeat: 2,
            onComplete: () => { this.activeHintTween = null; this.idleManager.reset(); }
        });

        const hX = target.getData('hintX') || 0;
        const hY = target.getData('hintY') || 0;
        const cx = target.getData('baseX');
        const cy = target.getData('baseY');

        const destX = cx + hX;
        const destY = cy + hY;

        // Calculate start position (Right side)
        const startX = destX + IDLE_CFG.OFFSET_X;
        const startY = destY + IDLE_CFG.OFFSET_Y;

        this.handHint.setPosition(startX, startY).setAlpha(0).setScale(0.7).setDepth(300).setFlipX(true);

        // Ensure hand points to the left (assuming default hand points up/left, we might need rotation?)
        // If default hand points top-left (standard pointer), we might want to rotate it or just place it.
        // Let's assume standard hand. If we want it "pointing into hint" from right:
        // If it's a finger, usually points Up-Left. 
        // Placing it at Bottom-Right pointing Up-Left is good.
        // No extra rotation needed if default is standard pointer.

        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: destX, y: destY, duration: IDLE_CFG.FADE_IN, ease: 'Power2' },
                { scale: 0.5, duration: IDLE_CFG.SCALE, yoyo: true, repeat: 3 },
                { alpha: 0, duration: IDLE_CFG.FADE_OUT }
            ]
        });
    }

    private debugShowAllHints() {
        console.log("--- DEBUG HINTS (INTERACTIVE) ---");

        this.unfinishedPartsMap.forEach((part, id) => {
            const hX = part.getData('hintX') || 0;
            const hY = part.getData('hintY') || 0;
            const cx = part.getData('baseX');
            const cy = part.getData('baseY');

            const destX = cx + hX;
            const destY = cy + hY;

            console.log(`[INIT] Hint for ${id}: x=${destX}, y=${destY} (global offset: ${hX}, ${hY})`);

            // Creates a draggable red circle
            const debugPoint = this.add.circle(destX, destY, 8, 0xff0000)
                .setDepth(300)
                .setInteractive({ draggable: true });

            // Label
            const label = this.add.text(destX, destY + 10, id, {
                color: '#ffff00',
                fontSize: '12px',
                backgroundColor: '#000000'
            }).setDepth(301).setOrigin(0.5, 0);

            debugPoint.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                debugPoint.x = dragX;
                debugPoint.y = dragY;
                label.setPosition(dragX, dragY + 10);
            });

            debugPoint.on('dragend', () => {
                // Calculate new global hintX/hintY based on center
                const newHintX = Math.round(debugPoint.x - cx);
                const newHintY = Math.round(debugPoint.y - cy);

                console.log(`%c[UPDATED] ${id} => hintX: ${newHintX}, hintY: ${newHintY}`, "color: #00ff00; font-weight: bold");

                // Update data so 'P' dump works correctly
                part.setData('hintX', newHintX);
                part.setData('hintY', newHintY);
            });
        });
    }

    private debugShowAllOffsets() {
        console.log("--- DEBUG OFFSETS (INTERACTIVE) ---");

        this.unfinishedPartsMap.forEach((part, id) => {
            const cx = part.getData('baseX');
            const cy = part.getData('baseY');

            // 1. Force draggable & Visible
            part.setInteractive({ draggable: true, pixelPerfect: false });
            part.setAlpha(1); // Make visible for debugging
            this.input.setDraggable(part);

            // 2. Drag Logic
            part.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                part.setPosition(dragX, dragY);
            });

            part.on('dragend', () => {
                const newOffsetX = Math.round(part.x - cx);
                const newOffsetY = Math.round(part.y - cy);

                console.log(`%c[UPDATED OFFSET] "${id}": { offsetX: ${newOffsetX}, offsetY: ${newOffsetY} }`, "color: #00ffff; font-weight: bold");

                part.setData('offsetX', newOffsetX);
                part.setData('offsetY', newOffsetY);
            });
        });
    }
}
