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

// 1. Check mobile
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// 2. TÍNH TOÁN RESOLUTION THÔNG MINH (BEST PRACTICE)
// Lấy tỉ lệ màn hình thực tế của thiết bị
const deviceRatio = window.devicePixelRatio || 1;
// 🔥 QUAN TRỌNG: Đặt giới hạn trần (Cap) là 1.5
// Dù màn hình xịn cỡ nào (Retina, 4K), game chỉ render tối đa 1.5 lần điểm ảnh CSS.
// Mắt thường không phân biệt được sự khác biệt trên màn hình đt bé, nhưng hiệu năng tăng gấp 3-4 lần.
const maxRatio = 1.5; 
const realRatio = Math.min(deviceRatio, maxRatio);

// Nếu là mobile nhân 0.6, PC nhân 0.8 (cho nhẹ hẳn)
const finalResolution = realRatio * (isMobile ? 0.6 : 0.8);

// --- CẤU HÌNH GAME (Theo cấu trúc mẫu: FIT) ---
const config: Phaser.Types.Core.GameConfig & { resolution?: number } = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    scene: [PreloadScene, Scene1, Scene2, EndGameScene],
    backgroundColor: '#ffffff',
    scale: {
        mode: Phaser.Scale.FIT,       // Dùng FIT để co giãn giữ tỉ lệ
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920, 
        height: 1080,
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    resolution: finalResolution, // ✅ Dùng biến đã tính toán kỹ
    render: {
        transparent: true,
        roundPixels: false, // Tắt làm tròn để mượt hơn
        antialias: true,    // Vẫn bật khử răng cưa cho đẹp
        powerPreference: 'default',
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
    const scaleFromViewport = Math.min(w, h) / 720;
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
