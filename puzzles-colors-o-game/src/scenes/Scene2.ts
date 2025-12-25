import Phaser from 'phaser';

import { SceneKeys, TextureKeys, DataKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants'; // Import
import { GameUtils } from '../utils/GameUtils';
import { IdleManager } from '../utils/IdleManager';
import { PaintManager } from '../utils/PaintManager'; 
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation'; 
import AudioManager from '../audio/AudioManager';

export default class Scene2 extends Phaser.Scene {
    private paintManager!: PaintManager;
    private idleManager!: IdleManager;

    private unfinishedPartsMap: Map<string, Phaser.GameObjects.Image> = new Map();
    private finishedParts: Set<string> = new Set();
    private partColors: Map<string, Set<number>> = new Map();
    private totalParts: number = 0;
    private isIntroActive: boolean = false;

    private paletteButtons: Phaser.GameObjects.Image[] = [];
    private handHint!: Phaser.GameObjects.Image;
    private firstColorBtn!: Phaser.GameObjects.Image;
    private activeHintTween: Phaser.Tweens.Tween | null = null;

    private readonly PALETTE_DATA = [
        { key: TextureKeys.BtnRed,    color: 0xFF595E },
        { key: TextureKeys.BtnYellow, color: 0xFFCA3A },
        { key: TextureKeys.BtnGreen,  color: 0x8AC926 },
        { key: TextureKeys.BtnBlue,   color: 0x1982C4 },
        { key: TextureKeys.BtnPurple, color: 0x6A4C93 },
        { key: TextureKeys.BtnCream,  color: 0xFDFCDC },
        { key: TextureKeys.BtnBlack,  color: 0x000000 }
    ];

    constructor() { super(SceneKeys.Scene2); }

    init() {
        this.unfinishedPartsMap.clear();
        this.finishedParts.clear();
        this.partColors.clear();
        this.totalParts = 0;
        this.paletteButtons = [];
    }

    create() {
        this.setupSystem();
        this.createUI();
        this.createLevel();
        
        this.setupInput();
        this.playIntroSequence();

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
        this.paintManager = null as any; 
    }

    private setupSystem() {
        resetVoiceState();
        (window as any).gameScene = this;
        setGameSceneReference(this);

        this.paintManager = new PaintManager(this, (id, rt, color) => {
            this.handlePartComplete(id, rt, color);
        });
        this.paintManager.setColor(this.PALETTE_DATA[0].color); 

        // Sử dụng Constant
        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => this.showHint());
    }

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
        
        // --- TÍNH TOÁN BIẾN TRUNG GIAN ---
        const bannerY = GameUtils.pctY(this, UI.BANNER_Y);
        const banner = this.add.image(cx, bannerY, TextureKeys.S2_Banner).setOrigin(0.5, 0).setScale(0.7);

        const textY = bannerY + banner.displayHeight/2;
        this.add.image(cx, textY, TextureKeys.S2_TextBanner).setScale(0.7);
        
        const boardY = banner.displayHeight + GameUtils.pctY(this, UI.BOARD_OFFSET);
        this.add.image(cx, boardY, TextureKeys.S2_Board).setOrigin(0.5, 0).setScale(0.7);

        this.createPalette();
        this.handHint = this.add.image(0, 0, TextureKeys.HandHint).setDepth(200).setAlpha(0).setScale(0.7);
    }

    private createPalette() {
        const UI = GameConstants.SCENE2.UI;

        // --- TÍNH TOÁN BIẾN TRUNG GIAN ---
        const spacing = GameUtils.pctX(this, UI.PALETTE_SPACING);
        const yPos = GameUtils.pctY(this, UI.PALETTE_Y);
        const totalItems = this.PALETTE_DATA.length + 1; 
        const startX = (GameUtils.getW(this) - (totalItems - 1) * spacing) / 2;

        this.PALETTE_DATA.forEach((item, i) => {
            const btnX = startX + (i * spacing);
            const btn = this.add.image(btnX, yPos, item.key).setInteractive();
            if (i === 0) {
                this.firstColorBtn = btn;
                btn.setScale(0.8).setAlpha(1); 
            } else {
                btn.setAlpha(0.8).setScale(0.6);
            }

            btn.on('pointerdown', () => {
                this.updatePaletteVisuals(btn);
                this.paintManager.setColor(item.color);
            });
            this.paletteButtons.push(btn);
        });

        const eraserX = startX + (this.PALETTE_DATA.length * spacing);
        const eraser = this.add.image(eraserX, yPos, TextureKeys.BtnEraser).setInteractive().setAlpha(0.8).setScale(0.6);
        eraser.on('pointerdown', () => {
            this.updatePaletteVisuals(eraser);
            this.paintManager.setEraser();
        });
        this.paletteButtons.push(eraser);
    }

    private updatePaletteVisuals(activeBtn: Phaser.GameObjects.Image) {
        this.paletteButtons.forEach(b => b.setScale(0.6).setAlpha(0.8));
        activeBtn.setScale(0.8).setAlpha(1);
    }

    private createLevel() {
        const data = this.cache.json.get(DataKeys.LevelS2Config);
        if (data) {
            this.spawnCharacter(data.teacher);
            this.spawnCharacter(data.letter);
        }
    }

    private spawnCharacter(config: any) {
        const cx = GameUtils.pctX(this, config.baseX_pct);
        const cy = GameUtils.pctY(this, config.baseY_pct);

        config.parts.forEach((part: any, index: number) => {
            const id = `${part.key}_${index}`;
            const layerX = cx + part.offsetX;
            const layerY = cy + part.offsetY;
            
            const hitArea = this.paintManager.createPaintableLayer(layerX, layerY, part.key, part.scale, id);

            hitArea.setData('hintX', part.hintX || 0);
            hitArea.setData('hintY', part.hintY || 0);
            hitArea.setData('originScale', part.scale);
            
            this.unfinishedPartsMap.set(id, hitArea);
            this.totalParts++;
        });

        this.add.image(cx, cy, config.outlineKey).setScale(config.baseScale).setDepth(100).setInteractive({ pixelPerfect: true });
    }

    private handlePartComplete(id: string, rt: Phaser.GameObjects.RenderTexture, color: number) {
        this.finishedParts.add(id);
        
        if (!this.partColors.has(id)) this.partColors.set(id, new Set());
        this.partColors.get(id)?.add(color);

        const used = this.partColors.get(id);
        if (used && used.size === 1) {
            rt.setBlendMode(Phaser.BlendModes.NORMAL);
            rt.fill(color);
        }

        this.unfinishedPartsMap.delete(id);
        this.partColors.delete(id);

        AudioManager.play('sfx-ting');
        
        // Sử dụng Constant Timing
        this.tweens.add({ targets: rt, alpha: 0.8, yoyo: true, duration: GameConstants.SCENE2.TIMING.AUTO_FILL, repeat: 2 });

        if (this.finishedParts.size >= this.totalParts) {
            console.log("WIN!");
            AudioManager.play('sfx-correct');
            this.time.delayedCall(GameConstants.SCENE2.TIMING.WIN_DELAY, () => this.scene.start(SceneKeys.EndGame));
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
        this.isIntroActive = false;
        this.idleManager.start(); 
        this.tweens.killTweensOf(this.handHint);
        this.handHint.setAlpha(0).setPosition(-200, -200);
    }

    private runHandTutorial() {
        if (!this.firstColorBtn || !this.isIntroActive) return;
        
        const UI = GameConstants.SCENE2.UI;
        const INTRO = GameConstants.SCENE2.INTRO_HAND;

        // --- TÍNH TOÁN BIẾN TRUNG GIAN ---
        const startX = this.firstColorBtn.x + 20;
        const startY = this.firstColorBtn.y + 20;
        const endX = GameUtils.pctX(this, UI.HAND_INTRO_END_X);
        const endY = GameUtils.pctY(this, UI.HAND_INTRO_END_Y);
        const dragY = endY + 100;

        this.handHint.setPosition(startX, startY).setAlpha(0).setScale(0.7);

        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: startX, y: startY, duration: INTRO.MOVE, ease: 'Power2' },
                { scale: 0.5, duration: INTRO.TAP, yoyo: true, repeat: 0.7 },
                { x: endX, y: dragY, duration: INTRO.DRAG, delay: 100 },
                { x: '-=30', y: '-=10', duration: INTRO.RUB, yoyo: true, repeat: 3 },
                { alpha: 0, duration: 500, onComplete: () => {
                    this.handHint.setPosition(-200, -200);
                    if (this.isIntroActive) this.time.delayedCall(1000, () => this.runHandTutorial());
                }}
            ]
        });
    }

    private showHint() {
        const items = Array.from(this.unfinishedPartsMap.values());
        if (items.length === 0) return;
        const target = items[Math.floor(Math.random() * items.length)];

        AudioManager.play('hint');
        
        const IDLE_CFG = GameConstants.IDLE;

        this.activeHintTween = this.tweens.add({
            targets: target, alpha: { from: 0.01, to: 0.6 },
            scale: { from: target.getData('originScale'), to: target.getData('originScale') * 1.05 },
            duration: IDLE_CFG.FADE_IN, yoyo: true, repeat: 2,
            onComplete: () => { this.activeHintTween = null; this.idleManager.reset(); }
        });

        // --- TÍNH TOÁN BIẾN TRUNG GIAN ---
        const hX = target.getData('hintX') || 0;
        const hY = target.getData('hintY') || 0;
        const destX = target.x + (hX * target.scaleX);
        const destY = target.y + (hY * target.scaleX);

        this.handHint.setPosition(destX + IDLE_CFG.OFFSET_X, destY + IDLE_CFG.OFFSET_Y).setAlpha(0).setScale(0.7);
        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: destX, y: destY, duration: IDLE_CFG.FADE_IN },
                { scale: 0.5, duration: IDLE_CFG.SCALE, yoyo: true, repeat: 3 },
                { alpha: 0, duration: IDLE_CFG.FADE_OUT }
            ]
        });
    }
}