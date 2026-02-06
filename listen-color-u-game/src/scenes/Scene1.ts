import Phaser from 'phaser';

import { SceneKeys, AudioKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants';
import { IdleManager } from '../utils/IdleManager';

import AudioManager from '../audio/AudioManager';
import { showGameButtons, sdk } from '../main';
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation';
import { changeBackground } from '../utils/BackgroundManager';
import { game } from '@iruka-edu/mini-game-sdk';
import { Scene1UI } from './components/scene1/Scene1UI';

export default class Scene1 extends Phaser.Scene {
    // UI Component
    private ui!: Scene1UI;

    // Logic State
    private isGameActive: boolean = false;
    private isHintActive: boolean = false;

    // System
    private bgm!: Phaser.Sound.BaseSound;
    private idleManager!: IdleManager;
    private instructionTimer?: Phaser.Time.TimerEvent;

    constructor() { super(SceneKeys.Scene1); }

    create() {
        this.setupSystem();
        this.setupBackgroundAndAudio();

        this.ui.create();

        // SDK Integration
        game.setTotal(1);
        (window as any).irukaGameState = {
            startTime: Date.now(),
            currentScore: 0,
        };
        sdk.score(0, 0);
        sdk.progress({ levelIndex: 0, total: 2 });
        game.startQuestionTimer();

        this.initGameFlow();

        this.events.on('wake', this.handleWake, this);
        this.events.on('poem-clicked', (msg: any) => this.handlePoemClick(msg));
        this.events.on('hint-finished', () => { this.isHintActive = false; this.idleManager.reset(); });
    }

    update(time: number, delta: number) {
        this.idleManager.update(delta);
    }

    shutdown() {
        this.events.off('wake', this.handleWake, this);
        this.events.off('poem-clicked');
        this.events.off('hint-finished');

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gameScene = this;
        setGameSceneReference(this);

        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => {
            this.showIdleHint();
        });

        this.input.on('pointerdown', () => {
            this.resetIdleState();
        });

        this.ui = new Scene1UI(this, (item) => {
            if (!this.isGameActive) return;
            const isCorrect = item.getData('isCorrect');
            isCorrect ? this.handleCorrect(item) : this.handleWrong(item);
        });
    }

    private setupBackgroundAndAudio() {
        changeBackground('assets/images/bg/backgroud_game.jpg');

        if (this.sound.get(AudioKeys.BgmNen)) {
            this.sound.stopByKey(AudioKeys.BgmNen);
        }
        this.bgm = this.sound.add(AudioKeys.BgmNen, { loop: true, volume: 0.25 });
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

    private handlePoemClick(poemText: Phaser.GameObjects.Image) {
        if (this.isGameActive) {
            AudioManager.stopAll();
            AudioManager.play('cau_do');
            this.ui.animatePoemClick(poemText);
        }
    }

    private handleWrong(item: Phaser.GameObjects.Image) {
        game.recordWrong();
        AudioManager.play('sfx-wrong');
        this.ui.animateWrong(item);
    }

    private handleCorrect(winnerItem: Phaser.GameObjects.Image) {
        this.isGameActive = false;

        // SDK Integration
        game.recordCorrect({ scoreDelta: 1 });
        if ((window as any).irukaGameState) {
            (window as any).irukaGameState.currentScore = 1;
        }
        sdk.score(1, 1);
        sdk.progress({ levelIndex: 0, score: 1 });
        game.finishQuestionTimer();

        if (this.instructionTimer) {
            this.instructionTimer.remove(false);
            this.instructionTimer = undefined;
        }
        this.idleManager.stop();

        AudioManager.stop('instruction');
        AudioManager.stop('cau_do');
        AudioManager.play('sfx-ting');

        this.ui.animateVictory(winnerItem, () => {
            playVoiceLocked(null, 'voice_cai_o');

            this.time.delayedCall(GameConstants.SCENE1.TIMING.DELAY_CORRECT_SFX, () => {
                AudioManager.play('sfx-correct');
                const khenTime = AudioManager.getDuration('sfx-correct');

                this.time.delayedCall(khenTime * 1000, () => {
                    this.nextScene();
                });
            });
        });
    }

    private resetIdleState() {
        this.idleManager.reset();
        if (this.isHintActive) {
            this.isHintActive = false;
            this.ui.hideHandHint();
        }
    }

    private showIdleHint() {
        if (!this.isGameActive || this.isHintActive) return;

        const correctItem = this.ui.getPuzzleItems().find(i => i.getData('isCorrect') === true);
        if (!correctItem) return;

        game.addHint();
        this.isHintActive = true;
        this.ui.showIdleHint(correctItem);
    }

    public restartIntro() {
        if (this.instructionTimer) { this.instructionTimer.remove(false); this.instructionTimer = undefined; }
        this.resetIdleState();
        this.idleManager.stop();
        this.initGameFlow();
    }

    private nextScene() {
        sdk.requestSave({ score: 1, levelIndex: 0 });
        sdk.progress({ levelIndex: 1, total: 2, score: 1 });

        this.time.delayedCall(GameConstants.SCENE1.TIMING.DELAY_NEXT, () => {
            this.scene.start(SceneKeys.Scene2);
        });
    }
}
