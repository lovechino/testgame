
import Phaser from 'phaser';
import { GameConstants } from '../consts/GameConstants';
import AudioManager from '../audio/AudioManager';
import { game } from "@iruka-edu/mini-game-sdk";

export class HintDisplayManager {
    private handHint: Phaser.GameObjects.Image;
    private scene: Phaser.Scene;
    private isHintActive: boolean = false;
    private activeHintTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Phaser.Scene, handHint: Phaser.GameObjects.Image) {
        this.scene = scene;
        this.handHint = handHint;
    }

    reset() {
        this.isHintActive = false;
        if (this.activeHintTween) {
            this.activeHintTween.stop();
            this.activeHintTween = null;
        }
        this.scene.tweens.killTweensOf(this.handHint);
        this.handHint.setAlpha(0).setPosition(-200, -200);
    }

    isActive() {
        return this.isHintActive;
    }

    showHint(targetX: number, targetY: number, config: any = GameConstants.IDLE, tracker?: any) {
        if (this.isHintActive) return;
        this.isHintActive = true;

        if (!config.muteAudio) {
            AudioManager.play('hint');
        }

        try {
            if (tracker && typeof tracker.hint === 'function') {
                tracker.hint();
            } else {
                game.addHint();
            }
        } catch (e) {
            console.warn('[HintDisplayManager] hint recording failed:', e);
        }

        // Calculate finger tip position
        // TIP_OFFSET moves the hand so the FINGER TIP (not hand center) points at target
        // We SUBTRACT the offset because we want to move the hand AWAY from target
        // so that the finger tip (which is offset from center) ends up AT the target
        // Calculate finger tip position
        // TIP_OFFSET pushes the hand AWAY from target so the finger tip ends up AT target
        // For a top-left finger at scale 0.8, center should be ~50px right and ~70px below target
        const destX = targetX + (config.TIP_OFFSET_X || 0);
        const destY = targetY + (config.TIP_OFFSET_Y || 0);
        const startX = destX + config.OFFSET_X;
        const startY = destY + config.OFFSET_Y;

        this.handHint.setPosition(startX, startY)
            .setAlpha(0)
            .setScale(0.8) // Increased scale slightly for visibility
            .setDepth(300);

        this.scene.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: destX, y: destY, duration: config.FADE_IN, ease: 'Power2' },
                { scale: 0.6, duration: config.SCALE, yoyo: true, repeat: 2 },
                {
                    alpha: 0,
                    duration: config.FADE_OUT,
                    onComplete: () => {
                        this.isHintActive = false;
                        this.handHint.setPosition(-200, -200);
                    }
                }
            ]
        });
    }

    // Helper to animate the target itself (pulse effect)
    pulseTarget(target: Phaser.GameObjects.Image, duration: number = 500) {
        const originScale = target.getData('originScale') || target.scale;

        this.activeHintTween = this.scene.tweens.add({
            targets: target,
            scale: { from: originScale, to: originScale * 1.05 },
            alpha: { from: 0.5, to: 1 },
            duration: duration,
            yoyo: true,
            repeat: 2,
            onComplete: () => { this.activeHintTween = null; }
        });
    }

    /**
     * DEBUG MODE: Enable interactive hand positioning
     * 
     * Press 'D' key to enable debug mode:
     * 1. Hand will appear at hint position
     * 2. Drag hand to desired position
     * 3. Console will show calculated offset values
     * 
     * Usage:
     * - In Scene1/Scene2, call: this.hintDisplayManager.enableDebugMode(hintX, hintY)
     * - Press 'D' to toggle debug mode
     * - Drag hand to correct position
     * - Check console for TIP_OFFSET_X and TIP_OFFSET_Y values
     */
    enableDebugMode(hintX: number, hintY: number) {

        // Show hand at hint position
        this.handHint.setPosition(hintX, hintY)
            .setAlpha(1)
            .setScale(0.8)
            .setDepth(10000); // Very high depth to prevent disappearing

        // Draw a red dot at hint position for reference
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(hintX, hintY, 10); // Bigger dot for visibility
        graphics.setDepth(9999);

        // Make hand draggable
        this.handHint.setInteractive({ draggable: true });
        this.scene.input.setDraggable(this.handHint);

        // Remove old listeners
        this.handHint.off('drag');
        this.handHint.off('dragend');

        // Add drag listener
        // Add drag listener (use _ prefix for unused parameter)
        this.handHint.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            this.handHint.setPosition(dragX, dragY);
        });

        // Add dragend listener to calculate offsets
        this.handHint.on('dragend', () => {
            const handX = this.handHint.x;
            const handY = this.handHint.y;

            // Calculate TIP_OFFSET (how far hand center is from hint point)
            const tipOffsetX = hintX - handX;
            const tipOffsetY = hintY - handY;

        });

    }

    /**
     * Disable debug mode
     */
    disableDebugMode() {
        // Re-enable scene input
        this.scene.input.enabled = true;

        this.handHint.disableInteractive();
        this.handHint.off('drag');
        this.handHint.off('dragend');
        this.handHint.setAlpha(0).setPosition(-200, -200);
    }
}