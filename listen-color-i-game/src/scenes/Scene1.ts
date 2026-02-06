import Phaser from 'phaser';
// 
import { SceneKeys, TextureKeys, AudioKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants'; // Import các hằng số cấu hình game
import { GameUtils } from '../utils/GameUtils';
import { IdleManager } from '../utils/IdleManager';

import AudioManager from '../audio/AudioManager';
import { showGameButtons, sdk } from '../main';
import { game } from "@iruka-edu/mini-game-sdk";
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation';
import { changeBackground } from '../utils/BackgroundManager';
import { Scene1UI } from './components/Scene1UI';

export default class Scene1 extends Phaser.Scene {
    // --- KHAI BÁO BIẾN UI & GAME OBJECTS ---
    private puzzleItems: Phaser.GameObjects.Image[] = [];

    private victoryBg!: Phaser.GameObjects.Image;   // Nền popup thắng
    private victoryText!: Phaser.GameObjects.Image; // Chữ "Hoan hô" hoặc kết quả

    private bannerBg!: Phaser.GameObjects.Image;    // Nền banner phía trên
    private handHint!: Phaser.GameObjects.Image;    // Bàn tay hướng dẫn (gợi ý)

    // --- KHAI BÁO BIẾN TRẠNG THÁI & HỆ THỐNG ---
    private isGameActive: boolean = false;

    private bgm!: Phaser.Sound.BaseSound;

    private idleManager!: IdleManager;

    private isHintActive: boolean = false;

    private instructionTimer?: Phaser.Time.TimerEvent;

    constructor() { super(SceneKeys.Scene1); }

    create() {
        this.setupSystem();             // Cài đặt hệ thống (Idle, Input...)
        this.setupBackgroundAndAudio(); // Cài đặt hình nền và nhạc nền
        this.createUI();                // Tạo các UI tĩnh (Banner, Hand)
        this.createGameObjects();       // Tạo các vật thể trong game (Bảng, Câu đố)
        this.initGameFlow();            // Bắt đầu luồng game (Intro voice -> Start)

        this.events.on('wake', this.handleWake, this);
    }

    update(time: number, delta: number) {
        this.idleManager.update(delta);
    }

    shutdown() {
        this.events.off('wake', this.handleWake, this);

        if (this.bgm && this.bgm.isPlaying) {
            this.bgm.stop();
        }

        if (this.instructionTimer) {
            this.instructionTimer.remove(false);
            this.instructionTimer = undefined;
        }

        if (this.idleManager) {
            this.idleManager.stop();
        }
    }

    private handleWake() {
        this.idleManager.reset();
        if (this.input.keyboard) this.input.keyboard.enabled = true;
        if (this.bgm && !this.bgm.isPlaying) this.bgm.play();
    }

    private setupSystem() {
        resetVoiceState();
        (window as any).gameScene = this;
        setGameSceneReference(this);

        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => {
            this.showIdleHint();
        });

        this.input.on('pointerdown', () => {
            this.resetIdleState();
        });
    }

    private setupBackgroundAndAudio() {
        changeBackground('assets/images/bg/backgroud_game.jpg');

        if (this.sound.get(AudioKeys.BgmNen)) {
            this.sound.stopByKey(AudioKeys.BgmNen);
        }
        this.bgm = this.sound.add(AudioKeys.BgmNen, { loop: true, volume: 0.25 });
    }

    private createUI() {
        const { bannerBg, handHint } = Scene1UI.createBanner(this);
        this.bannerBg = bannerBg;
        this.handHint = handHint;
    }

    private createGameObjects() {
        Scene1UI.createLeftPanel(this, this.bannerBg, () => this.isGameActive);

        const { puzzleItems, victoryBg, victoryText } = Scene1UI.createRightPanel(this, this.bannerBg, (item, isCorrect) => {
            if (this.isGameActive) {
                isCorrect ? this.handleCorrect(item) : this.handleWrong(item);
            }
        });

        this.puzzleItems = puzzleItems;
        this.victoryBg = victoryBg;
        this.victoryText = victoryText;
    }

    private initGameFlow() {
        if (this.input.keyboard) this.input.keyboard.enabled = false;

        const startAction = () => {
            if (!this.bgm.isPlaying) this.bgm.play();

            this.isGameActive = true;

            playVoiceLocked(null, 'instruction');
            const instructionTime = AudioManager.getDuration('instruction') + 0.5;

            this.instructionTimer = this.time.delayedCall(instructionTime * 1000, () => {
                if (this.isGameActive) {
                    playVoiceLocked(null, 'cau_do');
                    const riddleDuration = AudioManager.getDuration('cau_do');

                    this.time.delayedCall((riddleDuration * 1000) + GameConstants.SCENE1.TIMING.DELAY_IDLE, () => {
                        if (this.isGameActive) {
                            this.idleManager.start();
                        }
                    });
                }
            });

            if (this.input.keyboard) this.input.keyboard.enabled = true;

            showGameButtons();

            // SDK Start
            game.setTotal(2); // Total 2 levels (Scene1, Scene2)
            (window as any).irukaGameState = {
                startTime: Date.now(),
                currentScore: 0,
            };
            sdk.score(0, 0);
            sdk.progress({ levelIndex: 0, total: 2 });
            game.startQuestionTimer();
        };

        AudioManager.loadAll().then(() => {
            if (AudioManager.isUnlocked) {
                startAction();
            } else {
                this.input.once('pointerdown', () => {
                    AudioManager.unlockAudio();
                    startAction();
                });
            }
        });
    }

    handleWrong(item: Phaser.GameObjects.Image) {
        AudioManager.play('sfx-wrong');
        this.tweens.add({
            targets: item,
            angle: { from: -10, to: 10 },
            duration: GameConstants.SCENE1.ANIM.WRONG_SHAKE,
            yoyo: true,
            repeat: 3,
            onComplete: () => { item.angle = 0; }
        });
    }

    private handleCorrect(winnerItem: Phaser.GameObjects.Image) {
        this.isGameActive = false;

        // SDK Correct
        game.recordCorrect({ scoreDelta: 1 });
        if ((window as any).irukaGameState) {
            (window as any).irukaGameState.currentScore = 1;
        }
        sdk.score(1, 1);

        // Save & Progress to next level
        sdk.requestSave({
            score: 1,
            levelIndex: 0,
        });

        sdk.progress({
            levelIndex: 1,
            total: 2,
            score: 1,
        });
        game.finishQuestionTimer();

        if (this.instructionTimer) {
            this.instructionTimer.remove(false);
            this.instructionTimer = undefined;
        }
        this.idleManager.stop();

        this.puzzleItems.forEach(i => i.disableInteractive());
        this.tweens.killTweensOf(winnerItem);

        AudioManager.stop('instruction');
        AudioManager.stop('cau_do');
        AudioManager.play('sfx-ting');

        this.puzzleItems.forEach(i => {
            if (i !== winnerItem) this.tweens.add({ targets: i, alpha: 0, scale: 0, duration: 300 });
        });

        const ANIM = GameConstants.SCENE1.ANIM;
        this.tweens.add({ targets: this.victoryBg, scale: 0.9, duration: ANIM.WIN_POPUP, ease: 'Back.out' });
        this.tweens.add({ targets: this.victoryText, alpha: 1, y: this.victoryText.y - 20, duration: ANIM.WIN_POPUP });

        winnerItem.setDepth(100);
        this.tweens.add({
            targets: winnerItem,
            x: this.victoryBg.x,
            y: this.victoryBg.y - 100,
            scale: 0.7,
            duration: ANIM.WIN_POPUP,
            ease: 'Back.out',
            onComplete: () => {
                playVoiceLocked(null, 'voice_cai_o');

                this.time.delayedCall(GameConstants.SCENE1.TIMING.DELAY_CORRECT_SFX, () => {
                    AudioManager.play('sfx-correct');
                    const khenTime = AudioManager.getDuration('sfx-correct');

                    this.time.delayedCall(khenTime * 1000, () => {
                        this.nextScene();
                    });
                });
            }
        });
    }

    private resetIdleState() {
        this.idleManager.reset();
        if (this.isHintActive && this.handHint) {
            this.isHintActive = false;
            this.tweens.killTweensOf(this.handHint);
            this.handHint.setAlpha(0).setPosition(-200, -200);
        }
    }

    private showIdleHint() {
        if (!this.isGameActive || this.isHintActive) return;

        const correctItem = this.puzzleItems.find(i => i.getData('isCorrect') === true);
        if (!correctItem) return;

        this.isHintActive = true;

        this.handHint.setPosition(GameUtils.getW(this) + 100, GameUtils.getH(this));
        this.handHint.setAlpha(0);

        // SDK Hint
        game.addHint();

        const IDLE = GameConstants.IDLE;

        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: correctItem.x + IDLE.OFFSET_X, y: correctItem.y + IDLE.OFFSET_Y, duration: IDLE.FADE_IN, ease: 'Power2' },
                { scale: 0.5, duration: IDLE.SCALE, yoyo: true, repeat: 2 },
                {
                    alpha: 0, duration: IDLE.FADE_OUT, onComplete: () => {
                        this.isHintActive = false;
                        this.idleManager.reset();
                        this.handHint.setPosition(-200, -200);
                    }
                }
            ]
        });
    }

    public restartIntro() {
        if (this.instructionTimer) { this.instructionTimer.remove(false); this.instructionTimer = undefined; }
        this.resetIdleState();
        this.idleManager.stop();
        this.initGameFlow();
    }

    private nextScene() {
        this.time.delayedCall(GameConstants.SCENE1.TIMING.DELAY_NEXT, () => {
            this.scene.start(SceneKeys.Scene2);
        });
    }
}
