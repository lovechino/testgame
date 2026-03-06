import Phaser from 'phaser';
import { GameConstants } from '../../consts/GameConstants';
import { GameUtils } from '../../utils/GameUtils';
import { IdleManager } from '../../utils/IdleManager';
import { playVoiceLocked } from '../../utils/rotateOrientation';

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

        // Phát voice giới thiệu Scene 2
        playVoiceLocked(null, 'voice_intro_s2');

        this.scene.time.delayedCall(GameConstants.SCENE2.TIMING.INTRO_DELAY, () => {
            if (this.isIntroActive) {
                this.playColorHint();
            }
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

    /** Lặp bàn tay chỉ vào nút màu, KHÔNG phát âm thanh, cho đến khi stopIntro() được gọi */
    private playColorHint() {
        if (!this.firstColorBtn || !this.isIntroActive || !this.scene) return;

        const INTRO = GameConstants.SCENE2.INTRO_HAND;

        const targetX = this.firstColorBtn.x;
        const targetY = this.firstColorBtn.y;

        // Bàn tay xuất hiện từ phía dưới-phải nút màu
        const startX = targetX + 80;
        const startY = targetY + 120;

        if (!this.handHint) return;

        this.handHint.setPosition(startX, startY).setAlpha(0).setScale(0.8).setFlipX(false).setDepth(300);

        // Lấy danh sách các phần trưa tô từ Scene2 thông qua scene
        const scene2 = this.scene as any;
        let destX = targetX;
        let destY = targetY - 200; // Default fallback
        let targetPart: Phaser.GameObjects.Image | null = null;

        if (scene2.unfinishedPartsMap && scene2.unfinishedPartsMap.size > 0) {
            const items = Array.from(scene2.unfinishedPartsMap.values()) as Phaser.GameObjects.Image[];
            // Chỉ lấy phần tử đầu tiên để đảm bảo chỉ vào 1 hint duy nhất
            targetPart = items[0];

            if (targetPart) {
                const outlineScale = targetPart.getData('outlineScale') || 1;
                const partScaleMul = targetPart.getData('partScaleMul') || 1;
                const scaleAdjust = targetPart.getData('scaleAdjust') || 1;

                const hX = (targetPart.getData('hintX') || 0) * (outlineScale * partScaleMul * scaleAdjust);
                const hY = (targetPart.getData('hintY') || 0) * (outlineScale * partScaleMul * scaleAdjust);

                // Add TIP_OFFSET so the finger points exactly at the hint
                destX = targetPart.x + hX + (GameConstants.IDLE.TIP_OFFSET_X || 0);
                destY = targetPart.y + hY + (GameConstants.IDLE.TIP_OFFSET_Y || 0);

                // Record intro tutorial as a hint for this part
                const pId = targetPart.getData('partId');
                if (scene2.paintTrackerManager) {
                    const tracker = scene2.paintTrackerManager.getTracker(pId);
                    if (tracker && typeof tracker.hint === 'function') {
                        // tracker.hint();
                    }
                }

                console.log(`[INTRO] Target: ${pId}, destX: ${destX}, destY: ${destY}`);
            }
        }

        this.scene.tweens.chain({
            targets: this.handHint,
            tweens: [
                // Di chuyển đến nút màu
                { alpha: 1, x: targetX + (GameConstants.IDLE.TIP_OFFSET_X || 0), y: targetY + (GameConstants.IDLE.TIP_OFFSET_Y || 0), duration: INTRO.MOVE, ease: 'Power2' },
                // Nhấn xuống (giả lập chạm)
                { scale: 0.6, duration: INTRO.TAP, yoyo: true, repeat: 0 },
                // Kéo tay lên vị trí part cần tô
                {
                    x: destX,
                    y: destY,
                    duration: INTRO.DRAG,
                    delay: 100,
                    ease: 'Power1'
                },
                // Di di tay giả vờ tô màu
                { x: '-=30', y: '-=10', duration: INTRO.RUB, yoyo: true, repeat: 2 },
                // Ẩn đi
                {
                    alpha: 0, duration: 400, delay: 200,
                    onComplete: () => {
                        if (this.handHint) this.handHint.setPosition(-200, -200);
                        // Lặp lại sau 600ms nếu intro vẫn còn active
                        if (this.isIntroActive) {
                            this.scene.time.delayedCall(1000, () => this.playColorHint());
                        }
                    }
                }
            ]
        });
    }

    private runHandTutorial() {
        if (!this.firstColorBtn || !this.isIntroActive) {
            console.warn("[INTRO] Aborting - firstColorBtn missing or Intro inactive");
            return;
        }

        const UI = GameConstants.SCENE2.UI;
        const INTRO = GameConstants.SCENE2.INTRO_HAND;

        console.log("%c[INTRO] Playing Hand Tutorial Sequence", "color: #e6007e; font-weight: bold;");

        const startX = this.firstColorBtn.x + (GameConstants.IDLE.TIP_OFFSET_X || 0);
        const startY = this.firstColorBtn.y + (GameConstants.IDLE.TIP_OFFSET_Y || 0);
        const endX = GameUtils.pctX(this.scene, UI.HAND_INTRO_END_X);
        const endY = GameUtils.pctY(this.scene, UI.HAND_INTRO_END_Y);
        const dragY = endY + 100;

        if (!this.handHint) {
            console.error("[INTRO] FATAL: handHint is UNDEFINED!");
            return;
        }

        this.handHint.setPosition(startX, startY).setAlpha(0).setScale(0.8).setFlipX(false);

        this.scene.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: startX, y: startY, duration: INTRO.MOVE, ease: 'Power2' },
                { scale: 0.6, duration: INTRO.TAP, yoyo: true, repeat: 0.7 },
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
