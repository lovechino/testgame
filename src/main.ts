import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import EndGameScene  from './scenes/EndgameScene';
//import StartScene from './scenes/StartGameScene';
import { initRotateOrientation } from './rotateOrientation';
import AudioManager from './audio/AudioManager';

declare global {
    interface Window {
        gameScene: any;
    }
}

// --- CẤU HÌNH GAME (Theo cấu trúc mẫu: FIT) ---
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    scene: [GameScene, EndGameScene],
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
        pixelArt: false,
        antialias: true,
        transparent: true,
    },
};

const game = new Phaser.Game(config);

// --- 2. XỬ LÝ LOGIC UI & XOAY MÀN HÌNH (Giữ nguyên logic cũ của bạn) ---
function updateUIButtonScale() {
    const container = document.getElementById('game-container')!;
    const resetBtn = document.getElementById('btn-reset') as HTMLImageElement;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const scale = Math.min(w, h) / 720; 
    const baseSize = 80;
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

            AudioManager.stopAll(); 

            // 2. PHÁT SFX CLIC
            try {
                AudioManager.play('sfx-click'); 
            } catch (e) {
                console.error("Error playing sfx-click on restart:", e);
            }

            if (window.gameScene && window.gameScene.scene) {
                window.gameScene.scene.start('GameScene'); 
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