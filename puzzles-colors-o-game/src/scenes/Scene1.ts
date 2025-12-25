import Phaser from 'phaser';

import { SceneKeys, TextureKeys, AudioKeys } from '../consts/Keys';
import { GameUtils } from '../utils/GameUtils';
import { IdleManager } from '../utils/IdleManager';

import AudioManager from '../audio/AudioManager';
import { showGameButtons } from '../main';
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation'; 
import { changeBackground } from '../utils/BackgroundManager';


export default class Scene1 extends Phaser.Scene {
    // --- KHAI BÁO BIẾN ---
    private puzzleItems: Phaser.GameObjects.Image[] = [];
    private victoryBg!: Phaser.GameObjects.Image;
    private victoryText!: Phaser.GameObjects.Image;
    private bannerBg!: Phaser.GameObjects.Image;
    private handHint!: Phaser.GameObjects.Image;

    private isGameActive: boolean = false;
    private bgm!: Phaser.Sound.BaseSound;

    // Quản lý Logic gợi ý & Timer
    private idleManager!: IdleManager;
    private isHintActive: boolean = false;
    private instructionTimer?: Phaser.Time.TimerEvent;

    constructor() {
        super(SceneKeys.Scene1);
    }

    create() {
        this.setupSystem();
        this.setupBackgroundAndAudio();
        this.createUI();
        this.createGameObjects();
        this.initGameFlow();

        this.events.on('wake', () => {
            console.log("Scene đã thức dậy! Reset bộ đếm giờ.");
            this.idleManager.reset();
            if (this.input.keyboard) this.input.keyboard.enabled = true;
            if (!this.bgm.isPlaying) this.bgm.play();
        });
    }

    update(time: number, delta: number) {
        // Hàm update giờ chỉ còn 1 dòng duy nhất!
        this.idleManager.update(delta);
    }

    // --- 1. SETUP HỆ THỐNG ---
    private setupSystem() {
        resetVoiceState();
        (window as any).gameScene = this;
        setGameSceneReference(this);

        // Khởi tạo IdleManager: 10 giây không bấm -> gọi showIdleHint
        this.idleManager = new IdleManager(10000, () => {
            this.showIdleHint();
        });

        // Reset timer khi chạm màn hình
        this.input.on('pointerdown', () => {
            this.resetIdleState();
        });
    }

    // --- 2. SETUP BACKGROUND & AUDIO ---
    private setupBackgroundAndAudio() {
        changeBackground('assets/images/bg/backgroud_game.png'); // Đường dẫn ảnh nền giữ nguyên hoặc đưa vào Keys nếu muốn

        // Xử lý nhạc nền (Phaser Sound)
        if (this.sound.get(AudioKeys.BgmNen)) {
            this.sound.stopByKey(AudioKeys.BgmNen);
        }
        this.bgm = this.sound.add(AudioKeys.BgmNen, { loop: true, volume: 0.25 });
    }

    // --- 3. DỰNG GIAO DIỆN (UI) ---
    private createUI() {
        // Banner trên cùng
        const destY_Bg = GameUtils.pctY(this, 0.01);
        const centerX = GameUtils.pctX(this, 0.5);

        this.bannerBg = this.add.image(centerX, destY_Bg, TextureKeys.S1_BannerBg)
            .setOrigin(0.5, 0).setScale(0.7);
        
        const destY_Text = destY_Bg + this.bannerBg.displayHeight / 2;
        this.add.image(centerX, destY_Text, TextureKeys.S1_BannerText)
            .setScale(0.7);

        // Bàn tay gợi ý (mặc định ẩn)
        this.handHint = this.add.image(0, 0, TextureKeys.HandHint)
            .setDepth(200).setAlpha(0).setScale(0.7);
    }

    // --- 4. TẠO CÁC ĐỐI TƯỢNG GAME ---
    private createGameObjects() {
        this.createLeftPanel();
        this.createRightPanel();
    }

    private createLeftPanel() { 

        // Bảng bên trái
        const boardY = this.bannerBg.displayHeight + GameUtils.pctY(this, 0.03);
        const boardLeft = this.add.image(
            GameUtils.pctX(this, 0.5) - GameUtils.pctY(this, 0.01),
            boardY,
            TextureKeys.S1_Board
        ).setOrigin(1, 0).setScale(0.7);

        const centerX = GameUtils.pctX(this, 0.5 - boardLeft.displayWidth / GameUtils.getW(this) / 2) - GameUtils.pctY(this, 0.01);
        const centerY = boardY + boardLeft.displayHeight / 2;
        const underY = boardY + boardLeft.displayHeight;

        // Mây mưa & Bài thơ
        const rain = this.add.image(centerX, centerY + boardLeft.displayHeight * 0.45, TextureKeys.S1_Rain)
            .setScale(0.7).setOrigin(0.5, 1);

        const poemText = this.add.image(centerX, underY - rain.displayHeight - GameUtils.pctY(this, 0.05), TextureKeys.S1_PoemText)
            .setScale(0.7).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });

        this.tweens.add({ targets: poemText, y: '+=10', duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        
        poemText.on('pointerdown', () => {
            if (this.isGameActive) {
                AudioManager.stopAll();
                AudioManager.play('cau_do');
                this.tweens.add({ targets: poemText, scale: 0.6, duration: 100, yoyo: true, ease: 'Sine.easeInOut' });
            }
        });

        const iconO = this.add.image(
            centerX - boardLeft.displayWidth * 0.13, 
            boardY + GameUtils.pctY(this, 0.02), 
            TextureKeys.S1_IconOHeader
        ).setScale(0.7).setOrigin(0.5, 0);

        this.tweens.add({ targets: iconO, angle: { from: -4, to: 4 }, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    private createRightPanel() {
        // Bảng bên phải
        const boardY = this.bannerBg.displayHeight + GameUtils.pctY(this, 0.03);
        const boardRight = this.add.image(
            GameUtils.pctX(this, 0.5) + GameUtils.pctY(this, 0.01),
            boardY,
            TextureKeys.S1_Board
        ).setOrigin(0, 0).setScale(0.7);

        const centerX = GameUtils.pctX(this, 0.5 + boardRight.displayWidth / GameUtils.getW(this) / 2) + GameUtils.pctY(this, 0.01);
        const centerY = boardY + boardRight.displayHeight / 2;

        this.puzzleItems = []; // Reset mảng

        // Tạo 3 món đồ chơi (Sử dụng TextureKeys)
        this.createPuzzleItem(centerX - boardRight.displayWidth * 0.15, centerY - boardRight.displayWidth * 0.35, TextureKeys.S1_ItemUmbrella, true);
        this.createPuzzleItem(centerX - boardRight.displayWidth * 0.15, centerY + boardRight.displayWidth * 0.35, TextureKeys.S1_ItemMushroom, false);
        this.createPuzzleItem(centerX + boardRight.displayWidth * 0.25, centerY, TextureKeys.S1_ItemLamp, false);

        // UI Chiến thắng
        this.victoryBg = this.add.image(centerX, centerY, TextureKeys.BgPopup).setScale(0).setDepth(20);
        this.victoryText = this.add.image(centerX, centerY + 220, TextureKeys.S1_TextResult).setAlpha(0).setDepth(21).setScale(0.8);
    }

    private createPuzzleItem(x: number, y: number, key: string, isCorrect: boolean) {
        const item = this.add.image(x, y, key).setInteractive({ useHandCursor: true }).setScale(0.7);
        item.setData('isCorrect', isCorrect);

        // Hiệu ứng nhấp nhô
        this.tweens.add({ targets: item, y: y - 10, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        item.on('pointerdown', () => {
            if (!this.isGameActive) return;
            isCorrect ? this.handleCorrect(item) : this.handleWrong(item);
        });

        this.puzzleItems.push(item);
        return item;
    }

    // --- 5. LOGIC GAME FLOW ---
    
    // Được gọi khi bắt đầu vào màn hoặc khi Restart
    private initGameFlow() {
        if (this.input.keyboard) this.input.keyboard.enabled = false;

        const startAction = () => {
            if (!this.bgm.isPlaying) this.bgm.play();
            
            this.isGameActive = true;
            playVoiceLocked(null, 'instruction');
            const instructionTime = AudioManager.getDuration('instruction') + 0.5;

            // Timer chờ đọc xong hướng dẫn thì đọc câu đố
            this.instructionTimer = this.time.delayedCall(instructionTime * 1000, () => {
                if (this.isGameActive) {
                    playVoiceLocked(null, 'cau_do');
                    const riddleDuration = AudioManager.getDuration('cau_do');

                    // Đọc xong câu đố thì bắt đầu đếm giờ gợi ý
                    this.time.delayedCall((riddleDuration + 1) * 1000, () => {
                        if (this.isGameActive) {
                            this.idleManager.start(); 
                        }
                    });
                }
            });

            if (this.input.keyboard) this.input.keyboard.enabled = true;
            showGameButtons();
        };

        // Check Audio unlock (cho iOS)
        AudioManager.loadAll().then(() => {
            if (AudioManager.isUnlocked) {
                startAction();
            } else {
                this.input.once('pointerdown', () => {
                    AudioManager.unlockAudio();
                    startAction();
                });
            }
        });
    }

    // --- 6. XỬ LÝ TƯƠNG TÁC (ĐÚNG/SAI) ---

    handleWrong(item: Phaser.GameObjects.Image) {
        AudioManager.play('sfx-wrong')
        this.tweens.add({
            targets: item,
            angle: { from: -10, to: 10 },
            duration: 80,
            yoyo: true,
            repeat: 3,
            onComplete: () => { item.angle = 0; }
        });
    }

    private handleCorrect(winnerItem: Phaser.GameObjects.Image) {
        console.log("CHỌN ĐÚNG!");
        this.isGameActive = false;
        if (this.instructionTimer) this.instructionTimer.remove(false);
        this.idleManager.stop(); // Dừng gợi ý

        this.puzzleItems.forEach(i => i.disableInteractive());
        this.tweens.killTweensOf(winnerItem);

        AudioManager.stop('instruction');
        AudioManager.stop('cau_do');
        AudioManager.play('sfx-ting');

        // Ẩn các món sai
        this.puzzleItems.forEach(i => {
            if (i !== winnerItem) this.tweens.add({ targets: i, alpha: 0, scale: 0, duration: 300 });
        });

        // Hiện popup chiến thắng
        this.tweens.add({ targets: this.victoryBg, scale: 0.9, duration: 600, ease: 'Back.out' });
        this.tweens.add({ targets: this.victoryText, alpha: 1, y: this.victoryText.y - 20, duration: 600 });

        winnerItem.setDepth(100);
        this.tweens.add({
            targets: winnerItem,
            x: this.victoryBg.x,
            y: this.victoryBg.y - 100,
            scale: 0.7,
            duration: 600,
            ease: 'Back.out',
            onComplete: () => {
                playVoiceLocked(null, 'voice_cai_o');
                this.time.delayedCall(1500, () => {
                    AudioManager.play('sfx-correct');
                    const khenTime = AudioManager.getDuration('sfx-correct');
                    this.time.delayedCall(khenTime * 1000, () => {
                        this.nextScene();
                    });
                });
            }
        });
    }

    // --- 7. LOGIC GỢI Ý & HELPER ---
    // 2. Hàm tắt gợi ý (Reset)
    private resetIdleState() {
        this.idleManager.reset();
        if (this.isHintActive && this.handHint) {
            this.isHintActive = false;
            this.tweens.killTweensOf(this.handHint);
            this.handHint.setAlpha(0).setPosition(-200, -200);
        }
    }

    // Gợi ý ĐÁP ÁN (Chỉ thẳng vào cái Ô khi bí)
    private showIdleHint() {
        if (!this.isGameActive || this.isHintActive) return;
        const correctItem = this.puzzleItems.find(i => i.getData('isCorrect') === true);
        if (!correctItem) return;

        this.isHintActive = true;
        this.handHint.setPosition(GameUtils.getW(this) + 100, GameUtils.getH(this));
        this.handHint.setAlpha(0);

        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: correctItem.x + 30, y: correctItem.y + 30, duration: 800, ease: 'Power2' },
                { scale: 0.5, duration: 300, yoyo: true, repeat: 2 },
                { alpha: 0, duration: 500, onComplete: () => {
                        this.isHintActive = false;
                        this.idleManager.reset(); // Reset để đếm lại
                        this.handHint.setPosition(-200, -200);
                    }
                }
            ]
        });
    }

    private nextScene() {
        // Chuyển màn sau 3s (nếu cần)
        this.time.delayedCall(1000, () => {
            this.scene.start('Scene2');
        });
    }
}