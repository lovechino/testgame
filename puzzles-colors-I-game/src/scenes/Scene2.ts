import Phaser from 'phaser';
import { SceneKeys, TextureKeys, AudioKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants';
import { IdleManager } from '../utils/IdleManager';
import { PaintManager } from '../utils/PaintManager';
import { resetVoiceState, setGameSceneReference } from '../utils/rotateOrientation';
import AudioManager from '../audio/AudioManager';
import { Scene2Intro } from './components/Scene2Intro';
import { LevelLoader } from './components/LevelLoader';
import { Scene2UI } from './components/Scene2UI';
import { ManifestLoader } from '../utils/ManifestLoader';
import { changeBackground } from '../utils/BackgroundManager';
import { GameScoreManager } from '../managers/GameScoreManager';
import { HintDisplayManager } from '../managers/HintDisplayManager';
import { PaintTrackerManager } from '../managers/PaintTrackerManager';
import { Scene2Debug } from './components/Scene2Debug';

export default class Scene2 extends Phaser.Scene {
    public isResetting: boolean = false;
    private paintManager!: PaintManager;
    private idleManager!: IdleManager;
    private introManager!: Scene2Intro;
    private gameScoreManager!: GameScoreManager;
    private hintDisplayManager!: HintDisplayManager;
    private paintTrackerManager!: PaintTrackerManager;
    private bgm!: Phaser.Sound.BaseSound;

    private unfinishedPartsMap: Map<string, Phaser.GameObjects.Image> = new Map();
    private allPartsMap: Map<string, Phaser.GameObjects.Image> = new Map();
    private finishedParts: Set<string> = new Set();
    private totalParts: number = 0;

    private readonly PALETTE_DATA = [
        { key: TextureKeys.BtnRed, color: 0xFF595E },
        { key: TextureKeys.BtnYellow, color: 0xFFCA3A },
        { key: TextureKeys.BtnGreen, color: 0x8AC926 },
        { key: TextureKeys.BtnBlue, color: 0x1982C4 },
        // { key: TextureKeys.BtnPurple, color: 0x6A4C93 },
        { key: TextureKeys.BtnCream, color: 0xFDFCDC },
        // { key: TextureKeys.BtnBlack, color: 0x000000 },
        { key: TextureKeys.BtnGrey, color: 0x808080 },
        { key: TextureKeys.BtnOrange, color: 0xFFA500 },
        { key: TextureKeys.BtnPink, color: 0xFFC0CB },
    ];

    constructor() { super(SceneKeys.Scene2); }

    init() {
        this.unfinishedPartsMap.clear();
        this.allPartsMap.clear();
        this.finishedParts.clear();
        this.totalParts = 0;
    }

    preload() {
        const manifest = this.cache.json.get('game_manifest');
        if (manifest) ManifestLoader.processManifest(this, manifest);
    }

    create() {
        this.setupSystem();
        const customBg = this.registry.get('custom_bg');
        changeBackground(customBg || 'assets/images/bg/backgroud_game.jpg');

        // Phát nhạc nền (giữ liên tục từ Scene1)
        if (this.sound.get(AudioKeys.BgmNen)) this.sound.stopByKey(AudioKeys.BgmNen);
        this.bgm = this.sound.add(AudioKeys.BgmNen, { loop: true, volume: 0.25 });
        this.bgm.play();

        const { handHint, autoScales, outlines, firstColorBtn } = Scene2UI.createCompleteUI(
            this,
            this.paintManager,
            this.PALETTE_DATA,
            () => this.introManager.stopIntro()  // Gọi stopIntro khi bé chạm màu lần đầu
        );

        this.introManager.setTargets(handHint, firstColorBtn);
        this.hintDisplayManager = new HintDisplayManager(this, handHint);

        this.loadLevel(autoScales, outlines, handHint);

        this.gameScoreManager.startLevel(1, 2);
        this.gameScoreManager.setTotal(this.totalParts);

        this.setupInput();
        this.introManager.playIntroSequence();

        this.events.on('wake', () => {
            this.idleManager.reset();
            if (this.input.keyboard) this.input.keyboard.enabled = true;
        });

        // Đảm bảo Phaser gọi hàm shutdown của chúng ta khi Scene kết thúc
        this.events.on('shutdown', this.shutdown, this);
    }

    update(_time: number, delta: number) {
        if (!this.paintManager.isPainting() && !this.introManager.isIntroActive && this.finishedParts.size < this.totalParts) {
            this.idleManager.update(delta);
        }
    }

    shutdown() {
        this.introManager.stopIntro();
        if (this.bgm?.isPlaying) this.bgm.stop();
        this.paintManager = null as any;
        this.paintTrackerManager.finalizeAll(this.isResetting);
    }

    private setupSystem() {
        resetVoiceState();
        (window as any).gameScene = this;
        setGameSceneReference(this);

        this.gameScoreManager = GameScoreManager.getInstance(); // Dùng chung instance với Scene1 để giữ item handle
        this.paintTrackerManager = new PaintTrackerManager(this);

        this.paintManager = new PaintManager(
            this,
            (id, rt, usedColors) => this.handlePartComplete(id, rt, usedColors),
            (_id: string) => {
                // Tracking is now handled by the global shape tracker
            },
            (id: string, coverage: number, totalPx: number, matchPx: number, usedColors: Set<number>, spillPx: number, trueLastColor?: number) => {
                const hit = this.allPartsMap.get(id);
                if (hit) return this.paintTrackerManager.recordAttempt(id, hit, coverage, totalPx, matchPx, usedColors, spillPx, trueLastColor) as any;
            }
        );
        this.paintManager.setColor(this.PALETTE_DATA[0].color);
        this.paintTrackerManager.setPaintManager(this.paintManager);

        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => this.showHint());
        this.introManager = new Scene2Intro(this, this.idleManager);
    }

    private loadLevel(autoScales: { group1: number, group2: number }, outlines: any, handHint: Phaser.GameObjects.Image) {
        const { partsMap, totalParts } = LevelLoader.loadLevel(this, this.paintManager, (target) => {
            Scene2Debug.enableHintDebug(this, target, handHint);
        }, autoScales, outlines);
        this.unfinishedPartsMap = partsMap;
        this.allPartsMap = new Map(partsMap);
        this.totalParts = totalParts;

        this.paintTrackerManager.initShapeTrackers(this.allPartsMap);

        this.setupDebugKeys();
    }

    private setupDebugKeys() {
        // Chỉ chạy các phím debug ở môi trường DEV
        if (import.meta.env && import.meta.env.PROD) {
            return;
        }

        if (this.input.keyboard) {
            this.input.keyboard.enabled = true;
        }


        if (this.input.keyboard) {
            this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
                const code = event.code;
                if (code === 'KeyP') {
                    Scene2Debug.dumpDebugConfig(this, this.unfinishedPartsMap);
                } else if (code === 'KeyH') {
                    Scene2Debug.debugShowAllHints(this, this.unfinishedPartsMap);
                } else if (code === 'KeyO') {
                    Scene2Debug.debugShowAllOffsets(this, this.unfinishedPartsMap);
                }
            });
        }
    }

    private setupInput() {
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.paintManager.handlePointerMove(p));
        this.input.on('pointerup', () => this.paintManager.handlePointerUp());
        this.input.on('pointerdown', () => {
            this.idleManager.reset();
            this.introManager.stopIntro();
            this.hintDisplayManager.reset();
        });
    }

    private handlePartComplete(id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) {
        this.finishedParts.add(id);
        this.gameScoreManager.recordScore(1, 1);

        if (usedColors.size === 1) {
            const singleColor = usedColors.values().next().value || 0;
            rt.setBlendMode(Phaser.BlendModes.NORMAL);
            rt.fill(singleColor);
        } else {
            // const lastColor = this.paintManager.getCurrentColor();
            rt.setBlendMode(Phaser.BlendModes.NORMAL);
            // rt.fill(lastColor);
        }

        this.unfinishedPartsMap.delete(id);
        AudioManager.play('sfx-ting');
        this.tweens.add({ targets: rt, alpha: 0.8, yoyo: true, duration: GameConstants.SCENE2.TIMING.AUTO_FILL, repeat: 2 });

        if (this.finishedParts.size >= this.totalParts) {
            this.gameScoreManager.finalizeLevel(1, 2);
            AudioManager.play('sfx-correct_s2');
            this.time.delayedCall(GameConstants.SCENE2.TIMING.WIN_DELAY, () => this.scene.start(SceneKeys.EndGame));
        }
    }

    private showHint() {
        const entries = Array.from(this.unfinishedPartsMap.entries());
        if (entries.length === 0) return;

        const [_id, target] = entries[Math.floor(Math.random() * entries.length)];

        const outlineScale = target.getData('outlineScale') || 1;
        const partScaleMul = target.getData('partScaleMul') || 1;
        const scaleAdjust = target.getData('scaleAdjust') || 1;

        const hX = (target.getData('hintX') || 0) * (outlineScale * partScaleMul * scaleAdjust);
        const hY = (target.getData('hintY') || 0) * (outlineScale * partScaleMul * scaleAdjust);
        const destX = target.x + hX;
        const destY = target.y + hY;

        // Báo SDK item này đã được hiển thị (qua hint) và lấy tracker để gắn hint_used
        const partId = target.getData('partId') || _id;
        const tracker = this.paintTrackerManager.getTracker(partId);
        // Ghi nhận hint count → dùng để xác định HINT_RELIANCE trong PaintTrackerManager
        this.paintTrackerManager.recordHint(partId);
        this.hintDisplayManager.showHint(destX, destY, GameConstants.IDLE, tracker);

        // Custom pulse for Scene 2 (invisible hit area)
        this.tweens.add({
            targets: target,
            alpha: { from: 0.01, to: 0.3 },
            scale: { from: target.getData('originScale'), to: target.getData('originScale') * 1.01 },
            duration: GameConstants.IDLE.FADE_IN,
            yoyo: true,
            repeat: 2,
            onComplete: () => { this.idleManager.reset(); }
        });
    }
}