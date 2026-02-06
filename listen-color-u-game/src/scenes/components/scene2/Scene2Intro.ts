import Phaser from 'phaser';
import { GameConstants } from '../../../consts/GameConstants';
import { TextureKeys } from '../../../consts/Keys';
import { GameUtils } from '../../../utils/GameUtils';
import { IdleManager } from '../../../utils/IdleManager';
import { playVoiceLocked } from '../../../utils/rotateOrientation';
import AudioManager from '../../../audio/AudioManager';
import { game } from "@iruka-edu/mini-game-sdk";
import { Scene2UI } from './Scene2UI';
import { Scene2LevelManager } from './Scene2LevelManager';

export class Scene2Intro {
    private scene: Phaser.Scene;
    private ui: Scene2UI;
    private levelManager: Scene2LevelManager;
    private idleManager: IdleManager;

    private handHint!: Phaser.GameObjects.Image;
    private isIntroActive: boolean = false;
    private activeHintTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Phaser.Scene, ui: Scene2UI, levelManager: Scene2LevelManager, idleManager: IdleManager) {
        this.scene = scene;
        this.ui = ui;
        this.levelManager = levelManager;
        this.idleManager = idleManager;

        this.handHint = this.scene.add.image(0, 0, TextureKeys.HandHint).setDepth(200).setAlpha(0).setScale(0.7);
    }

    public playIntroSequence() {
        this.isIntroActive = true;
        playVoiceLocked(null, 'voice_intro_s2');
        this.scene.time.delayedCall(GameConstants.SCENE2.TIMING.INTRO_DELAY, () => { if (this.isIntroActive) this.runHandTutorial(); });
    }

    public stopIntro() {
        this.isIntroActive = false;
        this.idleManager.start();
        this.scene.tweens.killTweensOf(this.handHint);
        this.handHint.setAlpha(0).setPosition(-200, -200);
    }

    public restartIntro() {
        this.stopIntro();
        this.scene.time.delayedCall(GameConstants.SCENE2.TIMING.RESTART_INTRO, () => this.playIntroSequence());
    }

    public isActive(): boolean {
        return this.isIntroActive;
    }

    private runHandTutorial() {
        const firstBtn = this.ui.getFirstColorBtn();
        if (!firstBtn || !this.isIntroActive) return;

        const UI = GameConstants.SCENE2.UI;
        const INTRO = GameConstants.SCENE2.INTRO_HAND;

        const startX = firstBtn.x + 20;
        const startY = firstBtn.y + 20;
        const endX = GameUtils.pctX(this.scene, UI.HAND_INTRO_END_X);
        const endY = GameUtils.pctY(this.scene, UI.HAND_INTRO_END_Y);
        const dragY = endY + 100;

        this.handHint.setPosition(startX, startY).setAlpha(0).setScale(0.7);

        this.scene.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: startX, y: startY, duration: INTRO.MOVE, ease: 'Power2' },
                { scale: 0.5, duration: INTRO.TAP, yoyo: true, repeat: 0.7 },
                { x: endX, y: dragY, duration: INTRO.DRAG, delay: 100 },
                { x: '-=30', y: '-=10', duration: INTRO.RUB, yoyo: true, repeat: 3 },
                {
                    alpha: 0, duration: 500, onComplete: () => {
                        this.handHint.setPosition(-200, -200);
                        if (this.isIntroActive) this.scene.time.delayedCall(1000, () => this.runHandTutorial());
                    }
                }
            ]
        });
    }

    public showHint() {
        const items = this.levelManager.getUnfinishedParts();
        if (items.length === 0) return;

        const target = items[Math.floor(Math.random() * items.length)];

        AudioManager.play('hint');
        game.addHint();

        const IDLE_CFG = GameConstants.IDLE;

        this.activeHintTween = this.scene.tweens.add({
            targets: target, alpha: { from: 0.01, to: 0.3 },
            scale: { from: target.getData('originScale'), to: target.getData('originScale') * 1.01 },
            duration: IDLE_CFG.FADE_IN, yoyo: true, repeat: 2,
            onComplete: () => { this.activeHintTween = null; this.idleManager.reset(); }
        });

        const hX = target.getData('hintX') || 0;
        const hY = target.getData('hintY') || 0;
        const originScale = target.getData('originScale') || 1;

        const destX = target.x + (hX * originScale);
        const destY = target.y + (hY * originScale);

        this.handHint.setPosition(destX + IDLE_CFG.OFFSET_X, destY + IDLE_CFG.OFFSET_Y).setAlpha(0).setScale(0.7);

        this.scene.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: destX, y: destY, duration: IDLE_CFG.FADE_IN },
                { scale: 0.5, duration: IDLE_CFG.SCALE, yoyo: true, repeat: 3 },
                { alpha: 0, duration: IDLE_CFG.FADE_OUT }
            ]
        });
    }
}
