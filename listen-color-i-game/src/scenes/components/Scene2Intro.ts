import Phaser from 'phaser';
import { GameConstants } from '../../consts/GameConstants';
import { GameUtils } from '../../utils/GameUtils';
import { playVoiceLocked } from '../../utils/rotateOrientation';
import { IdleManager } from '../../utils/IdleManager';

export class Scene2Intro {
    private scene: Phaser.Scene;
    public isIntroActive: boolean = false;
    private handHint: Phaser.GameObjects.Image | null = null;
    private firstColorBtn: Phaser.GameObjects.Image | null = null;
    private idleManager: IdleManager;

    constructor(scene: Phaser.Scene, idleManager: IdleManager) {
        this.scene = scene;
        this.idleManager = idleManager;
    }

    public setTargets(handHint: Phaser.GameObjects.Image, firstColorBtn: Phaser.GameObjects.Image) {
        this.handHint = handHint;
        this.firstColorBtn = firstColorBtn;
    }

    public playIntroSequence() {
        this.isIntroActive = true;
        playVoiceLocked(null, 'voice_intro_s2');
        this.scene.time.delayedCall(GameConstants.SCENE2.TIMING.INTRO_DELAY, () => {
            if (this.isIntroActive) this.runHandTutorial();
        });
    }

    public stopIntro() {
        if (this.isIntroActive) {
            console.log("[DEBUG] stopIntro called - Intro ending, Idle starting.");
        }
        this.isIntroActive = false;
        this.idleManager.start();

        if (this.handHint) {
            this.scene.tweens.killTweensOf(this.handHint);
            this.handHint.setAlpha(0).setPosition(-200, -200);
        }
    }

    public restartIntro() {
        this.stopIntro();
        this.scene.time.delayedCall(GameConstants.SCENE2.TIMING.RESTART_INTRO, () => this.playIntroSequence());
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
        const endX = GameUtils.pctX(this.scene, UI.HAND_INTRO_END_X);
        const endY = GameUtils.pctY(this.scene, UI.HAND_INTRO_END_Y);
        const dragY = endY + 100;

        if (!this.handHint) {
            console.error("[INTRO] FATAL: handHint is UNDEFINED!");
            return;
        }

        this.handHint.setPosition(startX, startY).setAlpha(0).setScale(0.7).setFlipX(false);

        this.scene.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: startX, y: startY, duration: INTRO.MOVE, ease: 'Power2' },
                { scale: 0.5, duration: INTRO.TAP, yoyo: true, repeat: 0.7 },
                { x: endX, y: dragY, duration: INTRO.DRAG, delay: 100 },
                { x: '-=30', y: '-=10', duration: INTRO.RUB, yoyo: true, repeat: 3 },
                {
                    alpha: 0, duration: 500, onComplete: () => {
                        this.handHint?.setPosition(-200, -200);
                        if (this.isIntroActive) this.scene.time.delayedCall(1000, () => this.runHandTutorial());
                    }
                }
            ]
        });
    }
}
