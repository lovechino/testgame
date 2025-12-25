import Phaser from 'phaser';

// Imports
import { SceneKeys, TextureKeys, DataKeys } from '../consts/Keys';
import { GameUtils } from '../utils/GameUtils';
import { IdleManager } from '../utils/IdleManager';
import { PaintManager } from '../utils/PaintManager'; // IMPORT MỚI
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation'; 
import AudioManager from '../audio/AudioManager';

export default class Scene2 extends Phaser.Scene {
    // Managers
    private paintManager!: PaintManager;
    private idleManager!: IdleManager;

    // State
    private unfinishedPartsMap: Map<string, Phaser.GameObjects.Image> = new Map();
    private finishedParts: Set<string> = new Set();
    private partColors: Map<string, Set<number>> = new Map(); // Theo dõi màu cho mỗi phần
    private totalParts: number = 0;
    private isIntroActive: boolean = false;

    // UI
    private paletteButtons: Phaser.GameObjects.Image[] = [];
    private handHint!: Phaser.GameObjects.Image;
    private firstColorBtn!: Phaser.GameObjects.Image;

    // Palette Data
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
        // Chỉ đếm giờ khi không đang tô và Intro đã xong
        if (!this.paintManager.isPainting() && !this.isIntroActive && this.finishedParts.size < this.totalParts) {
            this.idleManager.update(delta);
        }
    }

    shutdown() {
        this.stopIntro();
        this.paintManager = null as any; // Giải phóng
    }

    // --- 1. HỆ THỐNG ---
    private setupSystem() {
        resetVoiceState();
        (window as any).gameScene = this;
        setGameSceneReference(this);

        // Khởi tạo PaintManager
        this.paintManager = new PaintManager(this, (id, rt, color) => {
            this.handlePartComplete(id, rt, color);
        });
        // Mặc định chọn màu đỏ
        this.paintManager.setColor(this.PALETTE_DATA[0].color);

        // Khởi tạo IdleManager
        this.idleManager = new IdleManager(10000, () => this.showHint());
    }

    private setupInput() {
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.paintManager.handlePointerMove(p));
        this.input.on('pointerup', () => this.paintManager.handlePointerUp());
        this.input.on('pointerdown', () => {
            this.idleManager.reset();
            this.stopIntro();
        });
    }

    // --- 2. GIAO DIỆN (UI) ---
    private createUI() {
        const cx = GameUtils.pctX(this, 0.5);
        
        // Banner
        const banner = this.add.image(cx, GameUtils.pctY(this, 0.01), TextureKeys.S2_Banner).setOrigin(0.5, 0).setScale(0.7);
        this.add.image(cx, GameUtils.pctY(this, 0.01) + banner.displayHeight/2, TextureKeys.S2_TextBanner).setScale(0.7);
        this.add.image(cx, banner.displayHeight + GameUtils.pctY(this, 0.03), TextureKeys.S2_Board).setOrigin(0.5, 0).setScale(0.7);

        // Palette
        this.createPalette();

        // Hand Hint
        this.handHint = this.add.image(0, 0, TextureKeys.HandHint).setDepth(200).setAlpha(0).setScale(0.7);
    }

    private createPalette() {
        const spacing = GameUtils.pctX(this, 0.07);
        const yPos = GameUtils.pctY(this, 0.89);
        const startX = (GameUtils.getW(this) - (this.PALETTE_DATA.length * spacing)) / 2;

        // Nút màu
        this.PALETTE_DATA.forEach((item, i) => {
            const btn = this.add.image(startX + i * spacing, yPos, item.key).setInteractive();
            if (i === 0) {
                this.firstColorBtn = btn;
                btn.setScale(0.8).setAlpha(1); // Highlight mặc định
            } else {
                btn.setAlpha(0.8).setScale(0.6);
            }

            btn.on('pointerdown', () => {
                this.updatePaletteVisuals(btn);
                this.paintManager.setColor(item.color);
            });
            this.paletteButtons.push(btn);
        });

        // Nút tẩy
        const eraser = this.add.image(startX + this.PALETTE_DATA.length * spacing, yPos, TextureKeys.BtnEraser).setInteractive().setAlpha(0.8).setScale(0.6);
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

    // --- 3. LEVEL & OBJECTS ---
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
            
            // Gọi PaintManager để tạo layer tô màu (Code gọn hẳn!)
            const hitArea = this.paintManager.createPaintableLayer(
                cx + part.offsetX, 
                cy + part.offsetY, 
                part.key, 
                part.scale, 
                id
            );

            // Lưu thông tin để hint
            hitArea.setData('hintX', part.hintX || 0);
            hitArea.setData('hintY', part.hintY || 0);
            hitArea.setData('originScale', part.scale);
            
            this.unfinishedPartsMap.set(id, hitArea);
            this.totalParts++;
        });

        // Outline đè lên
        this.add.image(cx, cy, config.outlineKey).setScale(config.baseScale).setDepth(100).setInteractive({ pixelPerfect: true });
    }

    // --- 4. GAME LOGIC ---
    private handlePartComplete(id: string, rt: Phaser.GameObjects.RenderTexture, color: number) {
        this.finishedParts.add(id);
        
        // Lưu màu để check auto-fill (Logic cũ của bạn, nhưng giờ quản lý ở Scene)
        if (!this.partColors.has(id)) this.partColors.set(id, new Set());
        this.partColors.get(id)?.add(color);

        // Auto-fill nếu chỉ dùng 1 màu
        const used = this.partColors.get(id);
        if (used && used.size === 1) {
            rt.setBlendMode(Phaser.BlendModes.NORMAL);
            rt.fill(color);
        }

        // Cleanup
        this.unfinishedPartsMap.delete(id);
        this.partColors.delete(id);

        AudioManager.play('sfx-ting');
        this.tweens.add({ targets: rt, alpha: 0.8, yoyo: true, duration: 100, repeat: 2 });

        if (this.finishedParts.size >= this.totalParts) {
            console.log("WIN!");
            AudioManager.play('sfx-correct');
            this.time.delayedCall(2500, () => this.scene.start(SceneKeys.EndGame));
        }
    }

    // --- 5. INTRO & HINT ---
    // (Giữ nguyên logic animation cũ nhưng dùng GameUtils)
    
    public restartIntro() {
        this.stopIntro();
        this.time.delayedCall(200, () => this.playIntroSequence());
    }

    private playIntroSequence() {
        this.isIntroActive = true;
        playVoiceLocked(null, 'voice_intro_s2');
        this.time.delayedCall(1000, () => { if (this.isIntroActive) this.runHandTutorial(); });
    }

    private stopIntro() {
        this.isIntroActive = false;
        this.idleManager.start();
        this.tweens.killTweensOf(this.handHint);
        this.handHint.setAlpha(0).setPosition(-200, -200);
    }

    private runHandTutorial() {
        if (!this.firstColorBtn || !this.isIntroActive) return;
        const start = { x: this.firstColorBtn.x + 20, y: this.firstColorBtn.y + 20 };
        const end = { x: GameUtils.pctX(this, 0.37), y: GameUtils.pctY(this, 0.48) };

        this.handHint.setPosition(start.x, start.y).setAlpha(0).setScale(0.7);
        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: start.x, y: start.y, duration: 600, ease: 'Power2' },
                { scale: 0.5, duration: 200, yoyo: true, repeat: 0.7 },
                { x: end.x, y: end.y + 100, duration: 800, delay: 100 },
                { x: '-=30', y: '-=10', duration: 400, yoyo: true, repeat: 3 },
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
        
        // Tween vật thể
        this.tweens.add({
            targets: target, alpha: { from: 0.01, to: 0.6 },
            scale: { from: target.getData('originScale'), to: target.getData('originScale') * 1.05 },
            duration: 800, yoyo: true, repeat: 2,
            onComplete: () => this.idleManager.reset()
        });

        // Tween bàn tay
        const hX = target.getData('hintX') || 0;
        const hY = target.getData('hintY') || 0;
        const destX = target.x + (hX * target.scaleX);
        const destY = target.y + (hY * target.scaleX);

        this.handHint.setPosition(destX + 50, destY + 50).setAlpha(0).setScale(0.7);
        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: destX, y: destY, duration: 500 },
                { scale: 0.5, duration: 400, yoyo: true, repeat: 3 },
                { alpha: 0, duration: 500 }
            ]
        });
    }
}