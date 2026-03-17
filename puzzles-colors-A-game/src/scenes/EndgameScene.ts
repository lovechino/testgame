import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { resetVoiceState } from '../utils/rotateOrientation';
import { game } from "@iruka-edu/mini-game-sdk";
import { hideGameButtons, sdk } from '../main';
import { SceneKeys, AudioKeys } from '../consts/Keys';

import { ConfettiManager } from './components/ConfettiManager';
import { EndgameUI } from './components/EndgameUI';
import { getFixedSubmitData } from '../utils/SDKHelper';

export default class EndGameScene extends Phaser.Scene {
    private confettiManager!: ConfettiManager;
    private bgm!: Phaser.Sound.BaseSound;

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

        EndgameUI.createCompleteUI(
            this,
            () => this.handleRestart(),
            () => this.handleExit()
        );

        hideGameButtons();

        this.confettiManager = new ConfettiManager(this);
        this.confettiManager.start();

        // Submit kết quả ngay khi vào EndgameScene
        this.submitResult();
    }

    private setupAudio() {
        AudioManager.loadAll();
        AudioManager.play('complete');

        // Tiếp tục phát nhạc nền
        if (this.sound.get(AudioKeys.BgmNen)) this.sound.stopByKey(AudioKeys.BgmNen);
        this.bgm = this.sound.add(AudioKeys.BgmNen, { loop: true, volume: 0.25 });
        this.bgm.play();

        this.time.delayedCall(2000, () => {
            AudioManager.play('fireworks');
            AudioManager.play('applause');
        });
    }

    private handleRestart() {
        this.time.removeAllEvents();
        this.sound.stopAll();
        if (this.bgm?.isPlaying) this.bgm.stop();
        AudioManager.stopAll();
        AudioManager.play('sfx-click');

        this.confettiManager.stop();

        // EndgameScene reset → XÓA TOÀN BỘ data, bắt đầu từ đầu (run_seq = 1)
        game.resetAll();

        // Reset irukaGameState về trạng thái ban đầu
        (window as any).irukaGameState = {
            runSeq: 1,
            startTime: Date.now(),
            currentScore: 0,
        };

        this.scene.start(SceneKeys.Scene1);
    }


    private submitResult() {
        // Finalize the attempt and prepare data
        game.finalizeAttempt("quit");
        const submitData = getFixedSubmitData();


        // Transform submitData.items into session_summary
        const session_summary: any = {
            selection_phase: {},
            painting_phase: {}
        };

        if (submitData.items && Array.isArray(submitData.items)) {
            submitData.items.forEach((item: any) => {
                const history = item.history || [];
                const lastAttempt = history.length > 0 ? history[history.length - 1] : null;

                if (item.item_id && String(item.item_id).toLowerCase().startsWith('select_')) {
                    const timeSpentMs = history.reduce((sum: number, att: any) => sum + (att.duration_ms || att.durationMs || 0), 0);
                    session_summary.selection_phase = {
                        action: "chọn đúng con vật",
                        is_correct: lastAttempt ? lastAttempt.is_correct : false,
                        time_spent: timeSpentMs / 1000
                    };
                } else if (item.item_type === 'paint' || (item.item_id && !String(item.item_id).toLowerCase().startsWith('select_'))) {
                    const partId = String(item.item_id).replace('PAINT_', '');

                    let spill_pixels = 0;
                    if (history && history.length > 0) {
                        spill_pixels = history.reduce((sum: number, att: any) => sum + (att.response?.total_paint_out_px || 0), 0);
                    }

                    session_summary.painting_phase[partId] = {
                        spills_pixels: spill_pixels,
                        hints_used: item.hint_used || 0,
                        completed: lastAttempt ? lastAttempt.is_correct : false
                    };
                }
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (window as any).irukaGameState || {};
        const startTime = state.startTime || Date.now();
        const timeMs = Date.now() - startTime;

        let totalScore = 0;

        if (submitData) {
            // Lấy điểm cuối của turn hiện tại thay vì cộng dồn mọi turns.
            totalScore = state.currentScore || 0;
            submitData.finalScore = totalScore;
            submitData.bestScore = totalScore;

            if ((submitData as any).stats) {
                (submitData as any).stats.finalScore = totalScore;
                (submitData as any).stats.bestScore = totalScore;
            }
        } else {
            totalScore = state.currentScore || 0;
        }

        const completeData = {
            timeMs: timeMs,
            score: totalScore,
            extras: {
                reason: "user_exit",
                session_summary: session_summary,
                stats: submitData
            },
        };
        sdk.complete(completeData);

    }

    private handleExit() {
        AudioManager.play('sfx-click');
        AudioManager.stopAll();
        this.confettiManager.stop();
        hideGameButtons();

        // GỌI HÀM SDK MỚI
        sdk.exit();
    }
}