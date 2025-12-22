import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager'; // Sửa đường dẫn nếu cần
import { showGameButtons, hideGameButtons } from '../main';

import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../rotateOrientation'; // Sửa đường dẫn nếu cần
import { changeBackground } from './utils/backgroundManager';


export default class Scene1 extends Phaser.Scene {
    // --- KHAI BÁO BIẾN ---
    private puzzleItems: Phaser.GameObjects.Image[] = [];
    private victoryBg!: Phaser.GameObjects.Image;
    private victoryText!: Phaser.GameObjects.Image;
    private isGameActive: boolean = false;
    private bgm!: Phaser.Sound.BaseSound;
    private bannerBg!: Phaser.GameObjects.Image;

    constructor() {
        super("Scene1");
    }

    // --- HELPER FUNCTIONS (Chuẩn theo code mẫu của bạn) ---
    private getW() { return this.scale.width; } // chiều rộng
    private getH() { return this.scale.height; } // chiều cao
    private pctX(p: number) { return this.getW() * p; }
    private pctY(p: number) { return this.getH() * p; }

    preload() {
        
        // UI Chung
        this.load.image('banner_bg', 'assets/images/S1/banner_1.png');
        this.load.image('banner_text', 'assets/images/S1/text_banner_1.png');
        this.load.image('board_white', 'assets/images/bg/board_Scene_1.png');

        // Bên Trái (Bài thơ)
        this.load.image('poem_text', 'assets/images/S1/doc_tho.png');
        this.load.image('img_rain', 'assets/images/S1/rain.png'); 
        this.load.image('icon_o_header', 'assets/images/ui/ellipse.png');
        this.load.image('btn_speaker', 'assets/images/ui/btn_exit.png'); // Dùng tạm làm nút loa

        // Bên Phải (Câu đố)
        this.load.image('item_umbrella', 'assets/images/S1/umbrella.png');
        this.load.image('item_mushroom', 'assets/images/S1/mushroom.png');
        this.load.image('item_lamp', 'assets/images/S1/lamp.png');

        // Kết quả chiến thắng
        this.load.image('bg_result', 'assets/images/bg/board_pop_up.png');
        this.load.image('text_result', 'assets/images/S1/text_umbrella.png');

        // Audio nhạc nền & SFX
        this.load.audio('bgm-nen','assets/audio/sfx/nhac_nen.mp3');
    }

    create() {
        this.bgm = this.sound.add('bgm-nen', { loop: true, volume: 0.05 });
        // 1. Setup hệ thống Rotation & Audio
        resetVoiceState();
        (window as any).gameScene = this; // 
        setGameSceneReference(this);
        changeBackground('assets/images/bg/backgroud_game.png');
        this.createBanner();
        // 2. Dựng giao diện (UI)
        this.createLeftPanel();
        this.createRightPanel();

        // 3. Logic bắt đầu game (Xử lý Unlock Audio)
        this.initAudioFlow();
    }

    // --- LOGIC KHỞI TẠO AUDIO ---
    initAudioFlow() {
        
        if (this.input.keyboard) {
            this.input.keyboard.enabled = false;
        }
    
        const startGameFlow = () => {
            if (!this.bgm.isPlaying) {
                this.bgm.play();
            }
            this.isGameActive = true;
            // Phát voice hướng dẫn + câu đố
            // Logic: Đọc hướng dẫn trước -> Hết hướng dẫn thì đọc câu đố (nếu muốn tách)
            // Ở đây mình gọi instruction chung theo file bạn có
            playVoiceLocked(null, 'instruction'); 
            
            // Nếu muốn đọc câu đố sau 3 giây (ví dụ)
            this.time.delayedCall(4000, () => {
                if (this.isGameActive) {
                    AudioManager.play('cau_do');
                };
            });
            // Mở lại bàn phím
            if (this.input.keyboard) {
                this.input.keyboard.enabled = true;
            }
            showGameButtons();
        };

        AudioManager.loadAll().then(() => {
            console.log("Audio Loaded Fully!");
            if (AudioManager.isUnlocked) {
                startGameFlow();
            } else {
                // Chờ click lần đầu để unlock (cho iOS)
                this.input.once('pointerdown', () => {
                    AudioManager.unlockAudio();
                    startGameFlow();
                });
            }
        });
    }

    // --- PHẦN DỰNG GIAO DIỆN ---

    createBanner() {
        const destY_Bg = this.pctY(0.01);
        const destY_Text = this.pctY(0.03);

        // --- 1. ĐẶT LUÔN TẠI VỊ TRÍ ĐÍCH (Không rơi nữa) ---
        this.bannerBg = this.add.image(
            this.pctX(0.5), 
            destY_Bg, // Đặt thẳng vào vị trí y chuẩn
            'banner_bg'
        ).setOrigin(0.5, 0).setScale(0.7);
        
        const text = this.add.image(
            this.pctX(0.5), 
            destY_Text, // Đặt thẳng vào vị trí y chuẩn
            'banner_text'
        ).setOrigin(0.5, 0).setScale(0.7);

        this.startBannerIdle(this.bannerBg, destY_Bg);
        this.startBannerIdle(text, destY_Text);
    }
    startBannerIdle(target: Phaser.GameObjects.Image, originalY: number) {
        this.tweens.add({
            targets: target,
            y: originalY + 5, 
            duration: 2000, 
            yoyo: true,  
            repeat: -1,
            ease: 'Sine.easeInOut' // Chuyển động mượt như sóng
        });
    }

    createLeftPanel() { 

        const broad_left =  this.add.image(
            this.pctX(0.5) - this.pctY(0.01), 
            this.bannerBg.displayHeight + this.pctY(0.03),
            'board_white'
        ).setOrigin(1,0).setScale(0.7);

        const centerX = this.pctX(0.5 - broad_left.displayWidth / this.getW() / 2) - this.pctY(0.01); 
        const centerY = this.bannerBg.displayHeight + this.pctY(0.03) + broad_left.displayHeight / 2;
        const underY =  this.bannerBg.displayHeight + this.pctY(0.03) + broad_left.displayHeight;

        const rain = this.add.image(
            centerX, 
            centerY + broad_left.displayHeight * 0.45, 
            'img_rain'
        ).setScale(0.7).setOrigin(0.5,1);

        this.tweens.add({
            targets: rain,
            y: '+=10', // Trôi lên xuống
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const cau_do =  this.add.image(
            centerX, 
            underY - rain.displayHeight - this.pctY(0.05), 
            'poem_text'
        ).setScale(0.7).setOrigin(0.5,1);

        const icon_o = this.add.image(
            centerX - broad_left.displayWidth * 0.13, 
            this.bannerBg.displayHeight + this.pctY(0.03) + this.pctY(0.02), 
            'icon_o_header'
        ).setScale(0.7).setOrigin(0.5,0);
        
        this.tweens.add({
            targets: icon_o,
            angle: { from: -5, to: 5 }, // Nghiêng qua lại
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createRightPanel() {
        // 1. Khung trắng
        const broad_right = this.add.image(
            this.pctX(0.5) + this.pctY(0.01), 
            this.bannerBg.displayHeight + this.pctY(0.03), 
            'board_white'
        ).setOrigin(0,0).setScale(0.7);

        const centerX = this.pctX(0.5 + broad_right.displayWidth / this.getW() / 2) + this.pctY(0.01);
        const centerY = this.bannerBg.displayHeight + this.pctY(0.03) + broad_right.displayHeight / 2;
        // 2. Tạo các món đồ chơi câu đố
        this.puzzleItems = []; // Reset mảng món đồ chơi

        // Tạo món đúng (cái ô)
        this.createPuzzleItem(
            centerX - broad_right.displayWidth * 0.15, 
            centerY - broad_right.displayWidth * 0.35, 
            'item_umbrella', 
            true, 
            0.7
        );
        // Tạo món sai 1 (cái nấm)
        this.createPuzzleItem(
            centerX - broad_right.displayWidth * 0.15, 
            centerY + broad_right.displayWidth * 0.35, 
            'item_mushroom', 
            false, 
            0.7
        );
        // Tạo món sai 2 (cái đèn)
        this.createPuzzleItem(
            centerX + broad_right.displayWidth * 0.25, 
            centerY, 
            'item_lamp', 
            false, 
            0.7
        );
        // --- UI CHIẾN THẮNG ---
        // Khung xanh
        this.victoryBg = this.add.image(centerX, centerY, 'bg_result');
        this.victoryBg.setScale(0).setDepth(20);

        // Chữ "Cái Ô" (Hiện ở dưới chân cái ô khi thắng)
        this.victoryText = this.add.image(centerX, centerY + 220, 'text_result');
        this.victoryText.setAlpha(0).setDepth(21).setScale(0.8);
    }

    // --- TẠO MÓN ĐỒ CHƠI CÂU ĐỐ ---
    createPuzzleItem(x: number, y: number, key: string, isCorrect: boolean, scaleVal: number) {
        const item = this.add.image(x, y, key)
            .setInteractive({ useHandCursor: true })
            .setScale(scaleVal); // Áp dụng scale nhỏ lại

        item.setData('isCorrect', isCorrect);
        item.setData('originScale', scaleVal); // Lưu scale gốc

        // IDLE: Nhấp nhô
        this.tweens.add({
            targets: item,
            y: y - 10, 
            duration: 1500,
            yoyo: true, 
            repeat: -1, 
            ease: 'Sine.easeInOut'
        });

        item.on('pointerdown', () => {
            if (!this.isGameActive) return; 
            
            if (isCorrect) {
                this.handleCorrect(item);
            } else {
                this.handleWrong(item);
            }
        });

        this.puzzleItems.push(item);
        return item;
    }

    // --- XỬ LÝ GAME LOGIC ---

    handleWrong(item: Phaser.GameObjects.Image) {
        AudioManager.play('sfx-wrong');
        this.tweens.add({
            targets: item,
            angle: { from: -10, to: 10 },
            duration: 80,
            yoyo: true,
            repeat: 3,
            onComplete: () => { item.angle = 0; }
        });
    }

    handleCorrect(winnerItem: Phaser.GameObjects.Image) {
        console.log("CHỌN ĐÚNG!");
        this.isGameActive = false;
        this.puzzleItems.forEach(i => i.disableInteractive());

        this.tweens.killTweensOf(winnerItem);
        AudioManager.play('sfx-ting');

        // Ẩn món sai
        this.puzzleItems.forEach(i => {
            if (i !== winnerItem) {
                this.tweens.add({ targets: i, alpha: 0, scale: 0, duration: 300 });
            }
        });

        this.tweens.add({
            targets: this.victoryBg,
            scale: 0.9, 
            duration: 600, // Mất 0.5s để hiện ra
            ease: 'Back.out'
        });

        this.tweens.add({
            targets: this.victoryText,
            alpha: 1, // 
            y: this.victoryText.y - 20, // Trồi lên nhẹ
            duration: 600,
        });

        // --- HIỆU ỨNG BAY VÀO ---
        winnerItem.setDepth(100);
        
        this.tweens.add({
            targets: winnerItem,
            x: this.victoryBg.x,
            
            // Bay lên cao hơn tâm một chút (-100px) để không che chữ bên dưới
            y: this.victoryBg.y - 100, 
            
            scale: 0.7, //
            duration: 600, //
            ease: 'Back.out',
            onComplete: () => {
                AudioManager.play('voice_cai_o');
                // Chuyển màn sau 3s (nếu cần)
                this.nextScene();
                
            }
        }); 
    }

    nextScene() {
        // Chuyển màn sau 3s (nếu cần)
        this.time.delayedCall(1000, () => {
            this.scene.start('Scene2'); 
        });
    }
}