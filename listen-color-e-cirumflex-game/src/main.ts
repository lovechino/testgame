import Phaser from 'phaser';
import Scene1 from './scenes/Scene1';
import Scene2 from './scenes/Scene2';
import PreloadScene from './scenes/PreloadScene';

import EndGameScene from './scenes/EndgameScene';
import { initRotateOrientation } from './utils/rotateOrientation';
import AudioManager from './audio/AudioManager';

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

const game = new Phaser.Game(config);

// --- 2. XỬ LÝ LOGIC UI & XOAY MÀN HÌNH (Giữ nguyên logic cũ của bạn) ---
function updateUIButtonScale() {
    //const container = document.getElementById('game-container')!;
    const resetBtn = document.getElementById('btn-reset') as HTMLImageElement;
    if (!resetBtn) return; // Thêm check null cho an toàn

    const w = window.innerWidth;
    const h = window.innerHeight;

    const MIN_UI_SCALE = 0.45;
    const MAX_UI_SCALE = 1;
    const scaleFromViewport = Math.min(w, h) / 1080;
    const scale = Math.min(Math.max(scaleFromViewport, MIN_UI_SCALE), MAX_UI_SCALE);
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

            //game.sound.stopAll();
            game.sound.stopByKey('bgm-nen');
            AudioManager.stopAll();
            // 2. PHÁT SFX CLIC
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
initRotateOrientation(game);
attachResetHandler();

// Scale nút
updateUIButtonScale();
window.addEventListener('resize', updateUIButtonScale);
window.addEventListener('orientationchange', updateUIButtonScale);

document.getElementById('btn-reset')?.addEventListener('sfx-click', () => {

    window.gameScene?.scene.restart();
});
