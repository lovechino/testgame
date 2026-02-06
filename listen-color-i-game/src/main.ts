import Phaser from 'phaser';
import Scene1 from './scenes/Scene1';
import Scene2 from './scenes/Scene2';
import PreloadScene from './scenes/PreloadScene';

import EndGameScene from './scenes/EndgameScene';
import { initRotateOrientation } from './utils/rotateOrientation';
import AudioManager from './audio/AudioManager';
import { game } from "@iruka-edu/mini-game-sdk";
import { installIrukaE2E } from './e2e/installIrukaE2E';

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
    const baseSize = 100;
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
            console.log('Restart button clicked. Stopping all audio and restarting scene.');

            // SDK Retry
            game.retryFromStart();

            gamePhaser.sound.stopByKey('bgm-nen');
            AudioManager.stopAll();
            try {
                AudioManager.play('sfx-click');
            } catch (e) {
                console.error("Error playing sfx-click on restart:", e);
            }

            if (window.gameScene && window.gameScene.scene) {
                window.gameScene.scene.stop();
                window.gameScene.scene.start('Scene1');
            } else {
                console.error('GameScene instance not found on window. Cannot restart.');
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


    onInit(ctx) {
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
        applyResize(size.width, size.height);
    },


    onSetState(state) {
        broadcastSetState(state);
    },


    onQuit() {
        // QUIT: chốt attempt là quit + gửi complete
        game.finalizeAttempt("quit");
        sdk.complete({
            timeMs: Date.now() - ((window as any).irukaGameState?.startTime ?? Date.now()),
            extras: { reason: "hub_quit", stats: game.prepareSubmitData() },
        });
    },
});

installIrukaE2E(sdk);

