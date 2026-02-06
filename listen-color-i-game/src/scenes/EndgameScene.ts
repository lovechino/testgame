import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { resetVoiceState } from '../utils/rotateOrientation';
import { game } from "@iruka-edu/mini-game-sdk";
import { hideGameButtons, sdk } from '../main';
import { SceneKeys } from '../consts/Keys';

import { ConfettiManager } from './components/ConfettiManager';
import { EndgameUI } from './components/EndgameUI';

export default class EndGameScene extends Phaser.Scene {
    private confettiManager!: ConfettiManager;

    constructor() { super(SceneKeys.EndGame); }

    preload() {
        this.load.image('icon', 'assets/images/ui/icon_end.png');
        this.load.image('banner_congrat', 'assets/images/bg/banner_congrat.png');
        this.load.image('btn_reset', 'assets/images/ui/btn_reset.png');
        this.load.image('btn_exit', 'assets/images/ui/btn_exit.png');
    }

    create() {
        resetVoiceState();

        this.setupAudio();

        EndgameUI.createBackground(this);
        EndgameUI.createAnimatedIcon(this);
        EndgameUI.createButtons(
            this,
            () => this.handleRestart(),
            () => this.handleExit()
        );

        hideGameButtons();

        this.confettiManager = new ConfettiManager(this);
        this.confettiManager.start();
    }

    private setupAudio() {
        AudioManager.loadAll();
        AudioManager.play('complete');

        this.time.delayedCall(2000, () => {
            AudioManager.play('fireworks');
            AudioManager.play('applause');
        });
    }

    private handleRestart() {
        this.time.removeAllEvents();
        this.sound.stopAll();
        AudioManager.stopAll();
        AudioManager.play('sfx-click');

        this.confettiManager.stop();

        game.retryFromStart();
        this.scene.start(SceneKeys.Scene1);
    }

    private handleExit() {
        AudioManager.play('sfx-click');
        AudioManager.stopAll();

        this.confettiManager.stop();
        hideGameButtons();

        sdk.complete({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            timeMs: Date.now() - ((window as any).irukaGameState?.startTime ?? Date.now()),
            extras: { reason: "user_exit", stats: game.prepareSubmitData() },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (window as any).irukaGameState || {};
        const payload = {
            score: state.currentScore || 0,
            timeMs: state.startTime ? Date.now() - state.startTime : 0,
            extras: { reason: 'user_exit' }
        };

        EndgameUI.showDebugOverlay(this, payload, () => {
            sdk.complete(payload);
            this.scene.start(SceneKeys.Scene1);
        });
    }
}