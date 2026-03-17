import Phaser from 'phaser';
import Scene1 from './scenes/Scene1';
import Scene2 from './scenes/Scene2';
import PreloadScene from './scenes/PreloadScene';

import EndGameScene from './scenes/EndgameScene';
import { initRotateOrientation } from './utils/rotateOrientation';
import AudioManager from './audio/AudioManager';
import { game } from "@iruka-edu/mini-game-sdk";
import { installIrukaE2E } from './e2e/installIrukaE2E';

import { getFixedSubmitData } from './utils/SDKHelper';

declare global {
    interface Window {
        gameScene: any;
        irukaHost: any; // Khai báo thêm để TS không báo lỗi
        irukaGameState: any;
    }
}

// --- CẤU HÌNH GAME (Theo cấu trúc mẫu: FIT) ---
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    scene: [PreloadScene, Scene1, Scene2, EndGameScene],
    backgroundColor: '#ffffff',
    scale: {
        mode: Phaser.Scale.FIT,       // Dùng FIT để co giãn giữ tỉ lệ
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    render: {
        transparent: true,
        // pixelArt: true,
        // roundPixels: true,
        // antialias: false
    },
};

export const gamePhaser = new Phaser.Game(config);

// --- 2. XỬ LÝ LOGIC UI & XOAY MÀN HÌNH (Giữ nguyên logic cũ của bạn) ---
function updateUIButtonScale() {
    const resetBtn = document.getElementById('btn-reset') as HTMLImageElement;
    if (!resetBtn) return; // Thêm check null cho an toàn

    const w = window.innerWidth;
    const h = window.innerHeight;

    const scale = Math.min(w, h) / 1080;
    const baseSize = 120;
    const newSize = baseSize * scale;

    resetBtn.style.width = `${newSize}px`;
    resetBtn.style.height = 'auto';
}

export function showGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (reset) reset.style.display = 'block';
}

export function hideGameButtons() {
    const reset = document.getElementById('btn-reset');
    if (reset) reset.style.display = 'none';
}

function attachResetHandler() {
    const resetBtn = document.getElementById('btn-reset') as HTMLImageElement;

    if (resetBtn) {
        resetBtn.onclick = () => {
            console.log('[Reset] Mid-game reset → thêm 1 run mới, giữ data cũ');

            AudioManager.stopAll();
            gamePhaser.sound.stopByKey('bgm-nen');
            try { AudioManager.play('sfx-click'); } catch (_e) { /* ignore */ }

            // 1. Đóng attempt thống kê hiện tại
            // LƯU Ý: Không dùng game.finalizeAttempt("quit") nữa
            // Vì nó sẽ tự ép lỗi USER_ABANDONED lên toàn bộ session đang mở.
            // Thay vào đó, ta dựa vào lifecycle shutdown của scene (nơi đã có cờ isResetting)
            // game.finalizeAttempt("quit");

            // 2. Tăng run_seq
            const gState = (window as any).irukaGameState || {};
            gState.runSeq = (gState.runSeq || 1) + 1;
            gState.currentScore = 0; // Kéo điểm về 0 để reset
            gState.startTime = Date.now();
            (window as any).irukaGameState = gState;

            // 4. Dùng ScenePlugin (scene.scene) của scene đang active để chuyển về Scene1
            //    ScenePlugin.start() đảm bảo stop scene hiện tại trước (trigger shutdown → finalizeAll)
            //    sau đó start Scene1 đúng lifecycle (init→preload→create)
            if (gamePhaser.scene.isActive('Scene2')) {
                const s2 = gamePhaser.scene.getScene('Scene2') as any;
                if (s2) s2.isResetting = true;
                s2?.scene.start('Scene1');  // stop Scene2 → trigger finalizeAll → start Scene1
            } else if (gamePhaser.scene.isActive('Scene1')) {
                const s1 = gamePhaser.scene.getScene('Scene1') as any;
                if (s1) s1.isResetting = true;
                s1?.scene.restart();        // restart Scene1 đúng lifecycle
            } else {
                // fallback
                gamePhaser.scene.start('Scene1');
            }

            hideGameButtons();
        };
    }
}


// Khởi tạo xoay màn hình
initRotateOrientation(gamePhaser);
attachResetHandler();

// Scale nút
updateUIButtonScale();
window.addEventListener('resize', updateUIButtonScale);
window.addEventListener('orientationchange', updateUIButtonScale);


// --- SDK INTEGRATION ---
function applyResize(width: number, height: number) {
    const gameDiv = document.getElementById('game-container');
    if (gameDiv) {
        gameDiv.style.width = `${width}px`;
        gameDiv.style.height = `${height}px`;
    }
    // Phaser Scale FIT: gọi resize để canvas update
    gamePhaser.scale.resize(width, height);
}


function broadcastSetState(payload: any) {
    // chuyển xuống scene đang chạy để bạn route helper (audio/score/timer/result...)
    const scene = gamePhaser.scene.getScenes(true)[0] as any;
    scene?.applyHubState?.(payload);
}


// lấy hubOrigin: tốt nhất từ query param, fallback document.referrer
function getHubOrigin(): string {
    const qs = new URLSearchParams(window.location.search);
    const o = qs.get("hubOrigin");
    if (o) return o;


    // fallback: origin của referrer (hub)
    try {
        const ref = document.referrer;
        if (ref) return new URL(ref).origin;
    } catch { }
    return "*"; // nếu protocol của bạn bắt buộc origin cụ thể thì KHÔNG dùng "*"
}


export const sdk = game.createGameSdk({
    hubOrigin: getHubOrigin(),


    onInit(_ctx) {
        // reset stats session nếu bạn muốn
        // game.resetAll(); hoặc statsCore.resetAll()


        // báo READY sau INIT
        sdk.ready({
            capabilities: ["resize", "score", "complete", "save_load", "set_state", "stats", "hint"],
        });
    },


    onStart() {
        gamePhaser.scene.resume("Scene2");
        gamePhaser.scene.resume("EndGameScene");
    },


    onPause() {
        gamePhaser.scene.pause("Scene2");
    },


    onResume() {
        gamePhaser.scene.resume("Scene2");
    },


    onResize(size) {
        // applyResize(size.width, size.height);
        applyResize(size.width, size.height);
        gamePhaser.scene.getScene("Scene2")?.scene.restart();
    },


    onSetState(state) {
        broadcastSetState(state);
    },


    onQuit() {
        // QUIT: chốt attempt là quit + gửi complete
        game.finalizeAttempt("quit");
        sdk.complete({
            timeMs: Date.now() - ((window as any).irukaGameState?.startTime ?? Date.now()),
            extras: { reason: "hub_quit", stats: getFixedSubmitData() },
        });
    },
});

installIrukaE2E(sdk);

