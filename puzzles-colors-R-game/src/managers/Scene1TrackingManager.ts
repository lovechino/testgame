import Phaser from 'phaser';
import { GameScoreManager } from './GameScoreManager';

export const SCENE1_ERRORS = {
    WRONG_OPTION: 'WRONG_OPTION',
    SIMILAR_CONFUSION: 'SIMILAR_CONFUSION',
    OPPOSITE_LOGIC: 'OPPOSITE_LOGIC',
    CONFUSED_ONE_MANY: 'CONFUSED_ONE_MANY',
    OVER_SELECTION: 'OVER_SELECTION',
    ODD_ONE_IN: 'ODD_ONE_IN',
    GUESSING_SPAM: 'GUESSING_SPAM',
    POSITION_BIAS: 'POSITION_BIAS',
    TIMEOUT: 'TIMEOUT',
    MISCLICK: 'MISCLICK',
    PROMPT_CLICK: 'PROMPT_CLICK'
};

export class Scene1TrackingManager {
    private scene: Phaser.Scene;
    private scoreManager: GameScoreManager;

    // Spam tracking
    private clickTimes: number[] = [];
    private readonly SPAM_TIME_WINDOW = 500; // 0.5s
    private readonly SPAM_CLICK_COUNT = 3;

    // Timeout tracking
    private timeoutTimer?: Phaser.Time.TimerEvent;
    private readonly TIMEOUT_DURATION = 20000; // 20s

    // Position Bias Tracking
    private firstClickPositionIndex: number | null = null;
    private consecutiveSamePositionClicks = 0;

    // Current item being tracked
    private currentItemKey: string | undefined;

    private isGameActiveFn: () => boolean;

    constructor(scene: Phaser.Scene, scoreManager: GameScoreManager, isGameActiveFn: () => boolean) {
        this.scene = scene;
        this.scoreManager = scoreManager;
        this.isGameActiveFn = isGameActiveFn;
    }

    setCurrentItemKey(itemKey: string) {
        this.currentItemKey = itemKey;
    }

    startTracking() {
        this.resetTracking();
        this.startTimeoutTimer();

        // Listen to global pointer down for MISCLICK
        this.scene.input.on('pointerdown', this.onGlobalPointerDown, this);
    }

    stopTracking() {
        if (this.timeoutTimer) {
            this.timeoutTimer.remove(false);
            this.timeoutTimer = undefined;
        }
        this.scene.input.off('pointerdown', this.onGlobalPointerDown, this);
    }

    private resetTracking() {
        this.clickTimes = [];
        if (this.timeoutTimer) {
            this.timeoutTimer.remove(false);
        }
    }

    private startTimeoutTimer() {
        if (this.timeoutTimer) {
            this.timeoutTimer.remove(false);
        }
        this.timeoutTimer = this.scene.time.delayedCall(this.TIMEOUT_DURATION, () => {
            if (this.isGameActiveFn()) {
                this.scoreManager.recordTrackingEvent(SCENE1_ERRORS.TIMEOUT, this.currentItemKey);
                // Restart timer after timeout to continue tracking if still active
                this.startTimeoutTimer();
            }
        });
    }

    private onGlobalPointerDown(_pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) {
        if (!this.isGameActiveFn()) return;

        // Reset timeout on any interaction
        this.startTimeoutTimer();

        // If clicking on nothing interactive, it's a MISCLICK
        const isInteractive = currentlyOver.some(obj => obj.input && obj.input.enabled);
        if (!isInteractive) {
            this.scoreManager.recordTrackingEvent(SCENE1_ERRORS.MISCLICK, this.currentItemKey);
        }
    }

    recordPromptClick() {
        if (!this.isGameActiveFn()) return;
        this.startTimeoutTimer();
        this.scoreManager.recordTrackingEvent(SCENE1_ERRORS.PROMPT_CLICK, this.currentItemKey);
    }

    // Called for any option click BEFORE processing correct/wrong visual logic
    // Returns specific error code if tracked as behavioral error, else null
    checkOptionClick(_itemKey: string, itemIndex: number): string | null {
        if (!this.isGameActiveFn()) return null;

        this.startTimeoutTimer();

        // 1. Check Guessing Spam
        const now = Date.now();
        this.clickTimes.push(now);
        this.clickTimes = this.clickTimes.filter(t => now - t <= this.SPAM_TIME_WINDOW);

        if (this.clickTimes.length >= this.SPAM_CLICK_COUNT) {
            return SCENE1_ERRORS.GUESSING_SPAM;
        }

        // 2. Check Position Bias
        if (this.firstClickPositionIndex === null) {
            this.firstClickPositionIndex = itemIndex;
            this.consecutiveSamePositionClicks = 1;
        } else if (this.firstClickPositionIndex === itemIndex) {
            this.consecutiveSamePositionClicks++;
            if (this.consecutiveSamePositionClicks >= 3) {
                return SCENE1_ERRORS.POSITION_BIAS;
            }
        } else {
            this.firstClickPositionIndex = itemIndex;
            this.consecutiveSamePositionClicks = 1;
        }

        return null; // Normal interaction, no behavioral error overridden
    }
}
