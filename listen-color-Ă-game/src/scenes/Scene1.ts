import Phaser from 'phaser';
import { SceneKeys, AudioKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants';
import { IdleManager } from '../utils/IdleManager';
import AudioManager from '../audio/AudioManager';
import { showGameButtons } from '../main';
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation';
import { changeBackground } from '../utils/BackgroundManager';
import { Scene1UI } from './components/Scene1UI';
import { ManifestLoader } from '../utils/ManifestLoader';
import { GameScoreManager } from '../managers/GameScoreManager';
import { HintDisplayManager } from '../managers/HintDisplayManager';
import { Scene1TrackingManager } from '../managers/Scene1TrackingManager';

export default class Scene1 extends Phaser.Scene {
    private puzzleItems: Phaser.GameObjects.Image[] = [];
    private victoryBg!: Phaser.GameObjects.Image;
    private victoryText!: Phaser.GameObjects.Image;
    private bannerBg!: Phaser.GameObjects.Image;
    private handHint!: Phaser.GameObjects.Image;

    private isGameActive: boolean = false;
    private bgm!: Phaser.Sound.BaseSound;
    private idleManager!: IdleManager;
    private instructionTimer?: Phaser.Time.TimerEvent;

    private gameScoreManager!: GameScoreManager;
    private hintDisplayManager!: HintDisplayManager;
    private trackingManager!: Scene1TrackingManager;

    constructor() { super(SceneKeys.Scene1); }

    preload() {
        const manifest = this.cache.json.get('game_manifest');
        if (manifest) ManifestLoader.processManifest(this, manifest);
    }

    create() {
        this.setupManagers();
        this.setupBackgroundAndAudio();
        this.createUI();
        this.createGameObjects();
        this.initGameFlow();

        this.events.on('wake', this.handleWake, this);
        this.events.on('shutdown', this.shutdown, this);
    }

    update(_time: number, delta: number) {
        this.idleManager.update(delta);
    }

    shutdown() {
        this.events.off('wake', this.handleWake, this);
        if (this.bgm?.isPlaying) this.bgm.stop();
        if (this.instructionTimer) this.instructionTimer.remove(false);
        this.idleManager?.stop();
        if (this.trackingManager) this.trackingManager.stopTracking();
        this.events.off('prompt-clicked');

        // Finalize selector tracker if scene shuts down before completion
        this.gameScoreManager.abandonScene1Item();
    }

    private handleWake() {
        this.idleManager.reset();
        if (this.input.keyboard) this.input.keyboard.enabled = true;
        if (this.bgm && !this.bgm.isPlaying) this.bgm.play();
    }

    private setupManagers() {
        resetVoiceState();
        (window as any).gameScene = this;
        setGameSceneReference(this);

        this.gameScoreManager = GameScoreManager.getInstance();
        this.gameScoreManager.resetFull(); // Reset toàn bộ state khi bắt đầu game mới
        this.trackingManager = new Scene1TrackingManager(this, this.gameScoreManager, () => this.isGameActive);
        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => this.showIdleHint());

        this.input.on('pointerdown', () => this.resetIdleState());

        this.events.on('prompt-clicked', () => {
            this.trackingManager.recordPromptClick();
        });
    }

    private setupBackgroundAndAudio() {
        const customBg = this.registry.get('custom_bg');
        changeBackground(customBg || 'assets/images/bg/backgroud_game.jpg');

        if (this.sound.get(AudioKeys.BgmNen)) this.sound.stopByKey(AudioKeys.BgmNen);
        this.bgm = this.sound.add(AudioKeys.BgmNen, { loop: true, volume: 0.25 });
    }

    private createUI() {
        const { bannerBg, handHint } = Scene1UI.createBanner(this);
        this.bannerBg = bannerBg;
        this.handHint = handHint;
        this.hintDisplayManager = new HintDisplayManager(this, this.handHint);
    }

    private createGameObjects() {
        const manifest = this.cache.json.get('game_manifest');
        const itemsData = manifest?.scenes?.scene1?.items || [];

        // Calculate a unified scale for both boards based on all content
        const unifiedScaleX = Scene1UI.calculateUnifiedScale(this, itemsData);

        Scene1UI.createLeftPanel(this, this.bannerBg, unifiedScaleX, () => this.isGameActive);

        const { puzzleItems, victoryBg, victoryText } = Scene1UI.createRightPanel(this, this.bannerBg, unifiedScaleX, itemsData, (item, isCorrect, index: number) => {
            if (this.isGameActive) {
                if (isCorrect) {
                    this.trackingManager.stopTracking();
                    this.handleCorrect(item);
                } else {
                    const trackingError = this.trackingManager.checkOptionClick(item.getData('key'), index);
                    this.handleWrong(item, trackingError);
                }
            }
        });

        this.puzzleItems = puzzleItems;
        this.victoryBg = victoryBg;
        this.victoryText = victoryText;
    }

    private initGameFlow() {
        if (this.input.keyboard) this.input.keyboard.enabled = false;

        AudioManager.loadAll().then(() => {
            if (AudioManager.isUnlocked) this.startAction();
            else this.input.once('pointerdown', () => { AudioManager.unlockAudio(); this.startAction(); });
        });
    }

    private startAction() {
        if (!this.bgm.isPlaying) this.bgm.play();
        this.isGameActive = true;

        playVoiceLocked(null, 'instruction');
        const instructionTime = AudioManager.getDuration('instruction') + 0.5;

        this.instructionTimer = this.time.delayedCall(instructionTime * 1000, () => {
            if (this.isGameActive) {
                playVoiceLocked(null, 'cau_do');
                const riddleDuration = AudioManager.getDuration('cau_do');
                this.time.delayedCall((riddleDuration * 1000) + GameConstants.SCENE1.TIMING.DELAY_IDLE, () => {
                    if (this.isGameActive) this.idleManager.start();
                });
            }
        });

        if (this.input.keyboard) this.input.keyboard.enabled = true;
        showGameButtons();
        this.gameScoreManager.startLevel(0, 2);
        this.trackingManager.startTracking();

        const options = this.puzzleItems.map(item => item.getData('key'));
        const correctItem = this.puzzleItems.find(item => item.getData('isCorrect'))?.getData('key');
        if (correctItem) {
            this.gameScoreManager.createScene1Item(correctItem, options);
            // Inform tracking manager which item is being attempted so it can pass
            // a valid selected_option when recording behavioural events (MISCLICK, TIMEOUT…)
            this.trackingManager.setCurrentItemKey(correctItem);
        }
    }

    handleWrong(item: Phaser.GameObjects.Image, overrideErrorCode?: string | null) {
        this.gameScoreManager.recordWrong();
        this.gameScoreManager.recordScene1Attempt(item.getData('key'), false, overrideErrorCode || undefined);
        AudioManager.play('sfx-wrong');
        this.tweens.add({
            targets: item, angle: { from: -10, to: 10 }, duration: GameConstants.SCENE1.ANIM.WRONG_SHAKE, yoyo: true, repeat: 3,
            onComplete: () => { item.angle = 0; }
        });
    }

    private handleCorrect(winnerItem: Phaser.GameObjects.Image) {
        this.isGameActive = false;
        this.gameScoreManager.recordScene1Attempt(winnerItem.getData('key'), true);
        this.gameScoreManager.recordScore(0, 1);
        this.gameScoreManager.finalizeLevel(0, 2);

        if (this.instructionTimer) this.instructionTimer.remove(false);
        this.idleManager.stop();

        this.puzzleItems.forEach(i => i.disableInteractive());
        this.tweens.killTweensOf(winnerItem);

        AudioManager.stop('instruction');
        AudioManager.stop('cau_do');
        AudioManager.play('sfx-ting');

        this.puzzleItems.forEach(i => { if (i !== winnerItem) this.tweens.add({ targets: i, alpha: 0, scale: 0, duration: 300 }); });
        this.playWinAnimation(winnerItem);
    }

    private playWinAnimation(winnerItem: Phaser.GameObjects.Image) {
        const ANIM = GameConstants.SCENE1.ANIM;
        this.tweens.add({ targets: this.victoryBg, scale: 0.9, duration: ANIM.WIN_POPUP, ease: 'Back.out' });
        this.tweens.add({ targets: this.victoryText, alpha: 1, y: this.victoryText.y - 20, duration: ANIM.WIN_POPUP });

        winnerItem.setDepth(100);
        this.tweens.add({
            targets: winnerItem, x: this.victoryBg.x, y: this.victoryBg.y - 60, scale: 0.7, duration: ANIM.WIN_POPUP, ease: 'Back.out',
            onComplete: () => {
                playVoiceLocked(null, 'voice_cai_o');
                this.time.delayedCall(GameConstants.SCENE1.TIMING.DELAY_CORRECT_SFX, () => {
                    AudioManager.play('sfx-correct');
                    this.time.delayedCall(AudioManager.getDuration('sfx-correct') * 1000, () => this.nextScene());
                });
            }
        });
    }

    private resetIdleState() {
        this.idleManager.reset();
        this.hintDisplayManager.reset();
    }

    private showIdleHint() {
        if (!this.isGameActive || this.hintDisplayManager.isActive()) return;
        const correctItem = this.puzzleItems.find(i => i.getData('isCorrect') === true);
        if (!correctItem) return;

        const tracker = this.gameScoreManager.getScene1Tracker();
        this.hintDisplayManager.showHint(correctItem.x, correctItem.y, { ...GameConstants.IDLE, muteAudio: true }, tracker);
    }

    public restartIntro() {
        if (this.instructionTimer) { this.instructionTimer.remove(false); this.instructionTimer = undefined; }
        this.resetIdleState();
        this.idleManager.stop();
        this.trackingManager.stopTracking();
        this.initGameFlow();
    }

    private nextScene() {
        this.time.delayedCall(GameConstants.SCENE1.TIMING.DELAY_NEXT, () => {
            this.scene.start(SceneKeys.Scene2);
        });
    }
}
