import { game } from "@iruka-edu/mini-game-sdk";
import { sdk } from '../main';

export class GameScoreManager {
    private static _instance: GameScoreManager | null = null;

    /** Singleton accessor — dùng chung giữa Scene1 và Scene2 */
    static getInstance(): GameScoreManager {
        if (!GameScoreManager._instance) {
            GameScoreManager._instance = new GameScoreManager();
        }
        return GameScoreManager._instance;
    }

    private scene1Tracker: any | null = null;
    private selectIndex: number = 0;
    private currentScore: number = 0;
    private scene1WrongCount: number = 0;
    private scene1HintCount: number = 0;

    private constructor() {
        this.resetFull();
    }

    /** Full reset — chỉ gọi ở đầu game mới (Scene1.create) */
    resetFull() {
        this.currentScore = 0;
        this.scene1Tracker = null;
        this.selectIndex = 0;
        this.scene1WrongCount = 0;
        this.scene1HintCount = 0;
    }

    reset() {
        this.currentScore = 0;
    }

    getScene1Tracker() {
        return this.scene1Tracker;
    }

    setTotal(total: number) {
        game.setTotal(total);
    }

    recordHint() {
        this.scene1HintCount++;
    }

    startLevel(levelIndex: number, totalLevels: number) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gState = (window as any).irukaGameState || {};

        if (levelIndex === 0) {
            gState.startTime = Date.now();
            gState.currentScore = 0;
            this.currentScore = 0;
        } else {
            this.currentScore = gState.currentScore || 0;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).irukaGameState = gState;

        sdk.score(this.currentScore, 0);
        sdk.progress({ levelIndex: levelIndex, total: totalLevels });
        game.startQuestionTimer();
    }

    /**
     * Tạo SelectTracker cho Scene 1.
     * Gọi khi câu hỏi bắt đầu và UI đã sẵn sàng cho user tương tác.
     */
    createScene1Item(correctItemId: string, options: string[]) {
        // Đảm bảo tracker cũ được dọn nếu còn sót
        this.abandonScene1Item();

        this.selectIndex++;
        this.scene1WrongCount = 0; // Reset số lần sai khi bắt đầu item mới
        this.scene1HintCount = 0; // Reset số lần hint khi bắt đầu item mới
        const itemId = `select_${this.selectIndex.toString().padStart(2, '0')}`;

        // Chèn runSeq từ global state
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (window as any).irukaGameState || {};
        const runSeq = state.runSeq || 1;

        this.scene1Tracker = game.createSelectTracker({
            meta: {
                item_id: itemId,
                item_type: 'select',
                seq: this.selectIndex,
                run_seq: runSeq,
                difficulty: 1,
                scene_id: 'SCN_SELECT_01',
                scene_seq: this.selectIndex,
                scene_type: 'select',
                skill_ids: [],
            },
            expected: {
                item_id_override: itemId,
                question_type: 'identify_one',
                correct_option: correctItemId,
                options: options.map(opt => ({ id: opt })),
                has_submit_button: false, // chọn là chốt luôn
            } as any,
            errorOnWrong: 'WRONG_OPTION',
        });

        // Thông báo SDK câu đã hiển thị → bắt đầu đo presented_at_ms / time_response_ms
        this.scene1Tracker.onShown(Date.now());
    }

    /**
     * Ghi nhận lần user chọn đáp án.
     * SDK tự chấm qua scoreSelect():
     *   đúng  → is_correct=true,  error_code=null
     *   sai   → is_correct=false, error_code="WRONG_OPTION"  (errorOnWrong)
     */
    recordScene1Attempt(selectedItemId: string, isCorrect: boolean, overrideError?: string) {
        if (!this.scene1Tracker) {
            console.error("recordScene1Attempt: scene1Tracker is NULL!");
            return;
        }

        if (overrideError && !isCorrect) {
            // SDK's `onChoose` auto-evaluates and applies `errorOnWrong` (e.g. WRONG_OPTION).
            // It doesn't accept dynamic error overrides.
            // So we log the Tracking Manager's custom insights (GUESSING_SPAM, POSITION_BIAS...)
            // as telemetry before recording the standard wrapper event.
            this.recordTrackingEvent(overrideError, selectedItemId);
        }

        console.log(`recordScene1Attempt: choosing ${selectedItemId}, isCorrect: ${isCorrect}`);
        // onChoose: ghi attempt, SDK tự tính is_correct từ correct_option vs selected
        this.scene1Tracker.onChoose(selectedItemId, Date.now());

        if (isCorrect) {
            console.log("recordScene1Attempt: Correct answer, finalizing tracker.");
            this.scene1Tracker.finalize();
            this.scene1Tracker = null;
        } else {
            console.log("recordScene1Attempt: Wrong answer, adding to history via retryAttempt.");
            this.scene1WrongCount++; // Tăng biến đếm số lần sai
            // Chuẩn bị attempt mới cho lần chọn tiếp theo trên CÙNG item_id
            this.scene1Tracker.retryAttempt(Date.now());
        }
    }

    /**
     * Khi user rời Scene 1 giữa chừng (shutdown hoặc quit).
     * Bắt buộc finalize để item vẫn xuất hiện trong JSON với error_code="USER_ABANDONED".
     */
    abandonScene1Item(isReset: boolean = false) {
        if (!this.scene1Tracker) return;

        // Nếu KHÔNG phải là reset -> Thoát thật giữa chừng
        if (!isReset) {
            this.scene1Tracker.onQuit(Date.now());
            this.scene1Tracker.finalize();
        }
        // Nếu LÀ Reset
        else if (this.scene1WrongCount >= 2 || this.scene1HintCount > 0) {
            // Đã sai >= 2 lần HOẶC có dùng hint thì mới ghi nhận lỗi Abandoned
            console.log(`[GameScoreManager] Reset with hints (${this.scene1HintCount}) or wrong count (${this.scene1WrongCount}). Finalizing.`);
            this.scene1Tracker.onQuit(Date.now());
            this.scene1Tracker.finalize();
        } else {
            // Nếu chưa sai đủ 2 lần và chưa dùng hint mà Reset -> Bỏ qua không finalize để không hiện trong log
            console.log("[GameScoreManager] Reset early (no hints, wrong < 2). Discarding Scene 1 item tracker.");
        }

        this.scene1Tracker = null;
        this.scene1WrongCount = 0;
        this.scene1HintCount = 0;
    }

    /**
     * Tracking events hành vi (MISCLICK, TIMEOUT, PROMPT_CLICK…).
     * KHÔNG dùng endAttempt — chỉ gửi metadata nhẹ qua sdk.progress().
     */
    recordTrackingEvent(errorCode: string, selectedItemId?: string) {
        if (!this.scene1Tracker) return;
        sdk.progress({
            event: errorCode,
            itemId: selectedItemId ?? null,
        });
    }

    recordScore(levelIndex: number, points: number = 1) {
        this.currentScore += points;

        game.recordCorrect({ scoreDelta: points });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).irukaGameState) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).irukaGameState.currentScore = this.currentScore;
        }

        sdk.score(this.currentScore, 1);

        sdk.progress({
            levelIndex: levelIndex,
            score: this.currentScore,
        });
    }

    finalizeLevel(levelIndex: number, totalLevels: number) {
        game.finishQuestionTimer();

        // Chỉ finalize attempt ở level cuối (nếu cần thiết cho legacy wrapper logic)
        // Note: game.finalizeAttempt() might conflict with tracker's submit if run concurrently,
        // but keeping it if wrapper expects it.
        if (levelIndex === totalLevels - 1) {
            game.finalizeAttempt();
        }

        sdk.requestSave({
            score: this.currentScore,
            levelIndex: levelIndex,
        });

        sdk.progress({
            levelIndex: levelIndex,
            total: totalLevels,
            score: this.currentScore,
        });
    }

    recordWrong() {
        game.recordWrong();
    }
}
