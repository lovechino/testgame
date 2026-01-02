import Phaser from 'phaser';

import { SceneKeys, TextureKeys, AudioKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants'; // Import các hằng số cấu hình game
import { GameUtils } from '../utils/GameUtils';
import { IdleManager } from '../utils/IdleManager';

import AudioManager from '../audio/AudioManager';
import { showGameButtons } from '../main';
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation'; 
import { changeBackground } from '../utils/BackgroundManager';

export default class Scene1 extends Phaser.Scene {
    // --- KHAI BÁO BIẾN UI & GAME OBJECTS ---
    // Danh sách các vật thể để người chơi chọn (cái ô, nấm, đèn...)
    private puzzleItems: Phaser.GameObjects.Image[] = [];
    private debugText!: Phaser.GameObjects.Text;
    
    // Các thành phần UI khi chiến thắng
    private victoryBg!: Phaser.GameObjects.Image;   // Nền popup thắng
    private victoryText!: Phaser.GameObjects.Image; // Chữ "Hoan hô" hoặc kết quả
    
    // Các thành phần UI chung
    private bannerBg!: Phaser.GameObjects.Image;    // Nền banner phía trên
    private handHint!: Phaser.GameObjects.Image;    // Bàn tay hướng dẫn (gợi ý)

    // --- KHAI BÁO BIẾN TRẠNG THÁI & HỆ THỐNG ---
    // Cờ kiểm tra game có đang hoạt động không (chặn click khi đang intro hoặc end game)
    private isGameActive: boolean = false;
    
    // Đối tượng âm thanh nền (Background Music)
    private bgm!: Phaser.Sound.BaseSound;
    
    // Quản lý trạng thái rảnh tay (Idle) để hiện gợi ý
    private idleManager!: IdleManager;
    
    // Cờ kiểm tra xem gợi ý có đang hiện hay không (tránh hiện chồng chéo)
    private isHintActive: boolean = false;
    
    // Timer quản lý luồng hướng dẫn (Instruction -> Câu đố), dùng để hủy nếu cần
    private instructionTimer?: Phaser.Time.TimerEvent;

    constructor() { super(SceneKeys.Scene1); }

    /**
     * Hàm khởi chạy đầu tiên khi Scene được tạo
     */
    create() {
        this.setupSystem();             // Cài đặt hệ thống (Idle, Input...)
        this.setupBackgroundAndAudio(); // Cài đặt hình nền và nhạc nền
        this.createUI();                // Tạo các UI tĩnh (Banner, Hand)
        this.createGameObjects();       // Tạo các vật thể trong game (Bảng, Câu đố)
        this.initGameFlow();            // Bắt đầu luồng game (Intro voice -> Start)

        // Sự kiện khi Scene được đánh thức lại (ví dụ: quay lại từ scene khác hoặc unmute)
        this.events.on('wake', this.handleWake, this);
        this.debugText = this.add.text(10, 50, 'FPS: 60', { font: '30px Arial', color: '#00ff00', backgroundColor: '#000000' });
        this.debugText.setScrollFactor(0).setDepth(9999);
    }

    /**
     * Vòng lặp game (chạy liên tục mỗi khung hình)
     * @param time Thời gian hiện tại
     * @param delta Khoảng thời gian giữa 2 frame
     */
    update(time: number, delta: number) {
        // Cập nhật bộ đếm thời gian rảnh
        this.idleManager.update(delta);
        
        const fps = Math.floor(this.game.loop.actualFps);
        this.debugText.setText(`FPS: ${fps}`);
        this.debugText.setColor(fps < 30 ? '#ff0000' : (fps < 55 ? '#ffff00' : '#00ff00'));
    }

    /**
     * Hàm dọn dẹp bộ nhớ khi chuyển Scene (QUAN TRỌNG)
     */
    shutdown() {
        // 1. Hủy lắng nghe sự kiện wake (để không bị nhân đôi khi quay lại)
        this.events.off('wake', this.handleWake, this);
        
        // 2. Dừng nhạc nền
        if (this.bgm && this.bgm.isPlaying) {
            this.bgm.stop();
        }

        // 3. Hủy timer đọc giọng nói (nếu đang chạy dở)
        if (this.instructionTimer) {
            this.instructionTimer.remove(false);
            this.instructionTimer = undefined;
        }

        // 4. Dừng Idle Manager
        if (this.idleManager) {
            this.idleManager.stop();
        }
    }

    // Hàm xử lý khi game được bật lại (tách ra từ create cũ)
    private handleWake() {
        this.idleManager.reset();
        if (this.input.keyboard) this.input.keyboard.enabled = true;
        if (this.bgm && !this.bgm.isPlaying) this.bgm.play();
    }

    // =================================================================
    // PHẦN 1: CÀI ĐẶT HỆ THỐNG (SYSTEM SETUP)
    // =================================================================

    /**
     * Cài đặt các tham chiếu hệ thống, input và trình quản lý Idle
     */
    private setupSystem() {
        resetVoiceState();
        (window as any).gameScene = this; // Gán reference vào window để debug hoặc truy cập từ ngoài
        setGameSceneReference(this);

        // Khởi tạo IdleManager với thời gian ngưỡng (THRESHOLD) từ config
        // Khi hết thời gian này mà không thao tác, hàm showIdleHint sẽ được gọi
        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => {
            this.showIdleHint();
        });

        // Bất cứ khi nào người chơi click, reset lại trạng thái Idle
        this.input.on('pointerdown', () => {
            this.resetIdleState();
        });
    }

    /**
     * Cài đặt hình nền và nhạc nền
     */
    private setupBackgroundAndAudio() {
        changeBackground('assets/images/bg/backgroud_game.jpg'); 
        
        // Dừng nhạc nền cũ nếu có (tránh chồng nhạc)
        if (this.sound.get(AudioKeys.BgmNen)) {
            this.sound.stopByKey(AudioKeys.BgmNen);
        }
        // Khởi tạo và phát nhạc nền mới
        this.bgm = this.sound.add(AudioKeys.BgmNen, { loop: true, volume: 0.25 });
    }

    // =================================================================
    // PHẦN 2: TẠO GIAO DIỆN & VẬT THỂ (UI & OBJECTS CREATION)
    // =================================================================

    /**
     * Tạo các thành phần UI cơ bản (Banner trên cùng, bàn tay gợi ý)
     */
    private createUI() {
        const UI = GameConstants.SCENE1.UI;
        const cx = GameUtils.pctX(this, 0.5); // Lấy tọa độ X giữa màn hình
        
        // --- TÍNH TOÁN BIẾN TRUNG GIAN ---
        const bannerY = GameUtils.pctY(this, UI.BANNER_Y);

        // Tạo nền banner
        this.bannerBg = this.add.image(cx, bannerY, TextureKeys.S1_BannerBg)
            .setOrigin(0.5, 0).setScale(0.7);
        
        // Tạo chữ trên banner (đặt vị trí dựa theo nền banner)
        const textY = bannerY + this.bannerBg.displayHeight / 2;
        this.add.image(cx, textY, TextureKeys.S1_BannerText).setScale(0.7);

        // Tạo bàn tay gợi ý (ẩn đi ban đầu)
        this.handHint = this.add.image(0, 0, TextureKeys.HandHint)
            .setDepth(200).setAlpha(0).setScale(0.7);
    }

    /**
     * Hàm bao bọc việc tạo các vật thể chơi game (chia làm 2 bảng trái/phải)
     */
    private createGameObjects() {
        this.createLeftPanel();  // Bảng bên trái (Bài thơ, icon trang trí)
        this.createRightPanel(); // Bảng bên phải (Các vật thể câu đố)
    }

    /**
     * Tạo bảng bên trái: Chứa bài thơ, hiệu ứng mưa, icon chữ O
     */
    private createLeftPanel() { 
        const UI = GameConstants.SCENE1.UI;
        const ANIM = GameConstants.SCENE1.ANIM;

        // 1. Vị trí Bảng (Dựa vào vị trí banner phía trên)
        const boardY = this.bannerBg.displayHeight + GameUtils.pctY(this, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(this, 0.5) - GameUtils.pctY(this, UI.BOARD_MARGIN_X);
        
        const boardLeft = this.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(1, 0).setScale(0.7); // Origin(1,0) nghĩa là neo ở góc trên bên phải của ảnh

        // 2. Tính tâm của bảng trái để đặt các nội dung con
        const centerX = GameUtils.pctX(this, 0.5 - boardLeft.displayWidth / GameUtils.getW(this) / 2) - GameUtils.pctY(this, UI.BOARD_MARGIN_X);
        const centerY = boardY + boardLeft.displayHeight / 2;
        const bottomY = boardY + boardLeft.displayHeight;

        // 3. Hiệu ứng ẢNH MINH HỌA
        const illustrationY = centerY + (boardLeft.displayHeight * UI.ILLUSTRATION_OFFSET);
        const illustration = this.add.image(centerX, illustrationY, TextureKeys.S1_Illustration)
            .setScale(0.8).setOrigin(0.5, 1);

        // 4. Bài thơ (Interactive: click vào sẽ đọc lại câu đố)
        const poemY = bottomY - illustration.displayHeight - GameUtils.pctY(this, UI.POEM_OFFSET);
        const poemText = this.add.image(centerX, poemY, TextureKeys.S1_PoemText)
            .setScale(0.7).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });

        // Hiệu ứng bài thơ trôi nhẹ lên xuống
        this.tweens.add({ targets: poemText, y: '+=10', duration: ANIM.POEM_FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        
        // Sự kiện click vào bài thơ
        poemText.on('pointerdown', () => {
            if (this.isGameActive) {
                AudioManager.stopAll();
                AudioManager.play('cau_do'); // Đọc lại câu đố
                // Hiệu ứng nhún nhẹ khi click
                this.tweens.add({ targets: poemText, scale: 0.6, duration: 100, yoyo: true, ease: 'Sine.easeInOut' });
            }
        });

        // 5. Icon O trang trí (lắc lư)
        const iconX = centerX - boardLeft.displayWidth * UI.ICON_O_X;
        const iconY = boardY + GameUtils.pctY(this, UI.ICON_O_Y);
        const iconO = this.add.image(iconX, iconY, TextureKeys.S1_IconOHeader)
            .setScale(0.8).setOrigin(0.5, 0);

        // Hiệu ứng lắc lư cho icon O
        this.tweens.add({ targets: iconO, angle: { from: -4, to: 4 }, duration: ANIM.ICON_SHAKE, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    /**
     * Tạo bảng bên phải: Chứa các vật thể để người chơi chọn (Item)
     */
    private createRightPanel() {
        const UI = GameConstants.SCENE1.UI;

        // 1. Tạo hình cái Bảng Phải
        const boardY = this.bannerBg.displayHeight + GameUtils.pctY(this, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(this, 0.5) + GameUtils.pctY(this, UI.BOARD_MARGIN_X);
        
        const boardRight = this.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(0, 0).setScale(0.7);

        // 2. Tính tâm bảng phải
        const centerX = GameUtils.pctX(this, 0.5 + boardRight.displayWidth / GameUtils.getW(this) / 2) + GameUtils.pctY(this, UI.BOARD_MARGIN_X);
        const centerY = boardY + boardRight.displayHeight / 2;

        this.puzzleItems = []; // Reset danh sách items

        // 3. Tạo các Item câu đố 
        // Item 1:
        const item1X = centerX + boardRight.displayWidth * UI.ITEM_OFFSET_X_1;
        const item1Y = centerY + boardRight.displayWidth * UI.ITEM_OFFSET_Y_1;
        this.createPuzzleItem(item1X, item1Y, TextureKeys.S1_Item_1, true);

        // Item 2: 
        const item2X = centerX + boardRight.displayWidth * UI.ITEM_OFFSET_X_2;
        const item2Y = centerY + boardRight.displayWidth * UI.ITEM_OFFSET_Y_2;
        this.createPuzzleItem(item2X, item2Y, TextureKeys.S1_Item_2, false);

        // Item 3:
        const item3X = centerX + boardRight.displayWidth * UI.ITEM_OFFSET_X_3; 
        const item3Y = centerY + boardRight.displayWidth * UI.ITEM_OFFSET_Y_3;
        this.createPuzzleItem(item3X, item3Y, TextureKeys.S1_Item_3, false);

        // 4. Tạo sẵn Popup chiến thắng (ẩn đi setScale=0)
        this.victoryBg = this.add.image(centerX, centerY, TextureKeys.BgPopup).setScale(0).setDepth(20);
        this.victoryText = this.add.image(centerX, centerY + 220, TextureKeys.S1_TextResult).setAlpha(0).setDepth(21).setScale(0.8);
    }

    /**
     * Hàm helper để tạo một vật thể câu đố
     * @param x Tọa độ X
     * @param y Tọa độ Y
     * @param key Texture Key của ảnh
     * @param isCorrect Đây có phải đáp án đúng không?
     */
    private createPuzzleItem(x: number, y: number, key: string, isCorrect: boolean) {
        const item = this.add.image(x, y, key).setInteractive({ useHandCursor: true }).setScale(0.7);
        // Lưu dữ liệu vào vật thể để biết đúng hay sai
        item.setData('isCorrect', isCorrect);

        // Hiệu ứng trôi nhẹ cho vật thể sống động
        this.tweens.add({ targets: item, y: y - 10, duration: GameConstants.SCENE1.ANIM.FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Xử lý sự kiện khi click vào vật thể
        item.on('pointerdown', () => {
            if (!this.isGameActive) return; // Nếu game chưa start (đang intro) thì không bấm được
            
            // Kiểm tra đúng hay sai
            isCorrect ? this.handleCorrect(item) : this.handleWrong(item);
        });

        this.puzzleItems.push(item);
        return item;
    }

    // =================================================================
    // PHẦN 3: LUỒNG GAME & LOGIC (GAME FLOW & LOGIC)
    // =================================================================

    /**
     * Khởi tạo luồng trò chơi (Intro -> Voice -> Unlock Input)
     */
    private initGameFlow() {
        if (this.input.keyboard) this.input.keyboard.enabled = false;

        // Hàm nội bộ: Bắt đầu thực sự sau khi đã load xong âm thanh
        const startAction = () => {
            if (!this.bgm.isPlaying) this.bgm.play();
            
            this.isGameActive = true;
            
            // 1. Phát giọng đọc hướng dẫn ("instruction")
            playVoiceLocked(null, 'instruction');
            const instructionTime = AudioManager.getDuration('instruction') + 0.5;

            // 2. Đợi giọng hướng dẫn xong -> Phát câu đố ("cau_do")
            this.instructionTimer = this.time.delayedCall(instructionTime * 1000, () => {
                if (this.isGameActive) {
                    playVoiceLocked(null, 'cau_do');
                    const riddleDuration = AudioManager.getDuration('cau_do');

                    // 3. Đợi đọc xong câu đố -> Bắt đầu đếm ngược Idle (gợi ý)
                    this.time.delayedCall((riddleDuration * 1000) + GameConstants.SCENE1.TIMING.DELAY_IDLE, () => {
                        if (this.isGameActive) {
                            this.idleManager.start(); 
                        }
                    });
                }
            });

            if (this.input.keyboard) this.input.keyboard.enabled = true;
            showGameButtons(); // Hiện nút Back/Home
        };

        // Load toàn bộ âm thanh, đảm bảo đã "Unlock" Audio Context của trình duyệt
        AudioManager.loadAll().then(() => {
            if (AudioManager.isUnlocked) {
                startAction();
            } else {
                // Nếu chưa unlock (thường gặp trên Chrome/Safari), yêu cầu click 1 lần để start
                this.input.once('pointerdown', () => {
                    AudioManager.unlockAudio();
                    startAction();
                });
            }
        });
    }

    /**
     * Xử lý khi chọn SAI
     */
    handleWrong(item: Phaser.GameObjects.Image) {
        AudioManager.play('sfx-wrong')
        // Hiệu ứng rung lắc (shake) báo hiệu sai
        this.tweens.add({
            targets: item,
            angle: { from: -10, to: 10 },
            duration: GameConstants.SCENE1.ANIM.WRONG_SHAKE,
            yoyo: true,
            repeat: 3,
            onComplete: () => { item.angle = 0; } // Trả về góc 0 sau khi lắc xong
        });
    }

    /**
     * Xử lý khi chọn ĐÚNG
     */
    private handleCorrect(winnerItem: Phaser.GameObjects.Image) {
        this.isGameActive = false; // Khóa game, không cho click nữa
        
        // Hủy timer hướng dẫn nếu đang chạy (tránh việc voice chồng voice)
        if (this.instructionTimer) {
            this.instructionTimer.remove(false);
            this.instructionTimer = undefined;
        }
        this.idleManager.stop(); 

        // Vô hiệu hóa tương tác tất cả vật thể
        this.puzzleItems.forEach(i => i.disableInteractive());
        this.tweens.killTweensOf(winnerItem); // Dừng hiệu ứng trôi nổi

        // Dừng voice cũ, phát tiếng ting ting
        AudioManager.stop('instruction');
        AudioManager.stop('cau_do');
        AudioManager.play('sfx-ting');

        // Ẩn các vật thể không phải đáp án đúng
        this.puzzleItems.forEach(i => {
            if (i !== winnerItem) this.tweens.add({ targets: i, alpha: 0, scale: 0, duration: 300 });
        });

        // Hiện popup chiến thắng
        const ANIM = GameConstants.SCENE1.ANIM;
        this.tweens.add({ targets: this.victoryBg, scale: 0.9, duration: ANIM.WIN_POPUP, ease: 'Back.out' });
        this.tweens.add({ targets: this.victoryText, alpha: 1, y: this.victoryText.y - 20, duration: ANIM.WIN_POPUP });

        // Di chuyển đáp án đúng vào giữa popup
        winnerItem.setDepth(100);
        this.tweens.add({
            targets: winnerItem,
            x: this.victoryBg.x,
            y: this.victoryBg.y - 100,
            scale: 0.7,
            duration: ANIM.WIN_POPUP,
            ease: 'Back.out',
            onComplete: () => {
                // Đọc tên vật thể ("Cái Ô")
                playVoiceLocked(null, 'voice_item_win');
                
                // Đợi 1 chút rồi phát tiếng vỗ tay/khen ngợi
                this.time.delayedCall(GameConstants.SCENE1.TIMING.DELAY_CORRECT_SFX, () => {
                    AudioManager.play('sfx-correct');
                    const khenTime = AudioManager.getDuration('sfx-correct');
                    
                    // Đợi khen xong thì chuyển Scene
                    this.time.delayedCall(khenTime * 1000, () => {
                        this.scene.start(SceneKeys.Scene2);
                    });
                });
            }
        });
    }

    // =================================================================
    // PHẦN 4: HỖ TRỢ & ĐIỀU HƯỚNG (HELPERS & NAVIGATION)
    // =================================================================

    /**
     * Reset lại trạng thái Idle (khi người chơi có tương tác)
     */
    private resetIdleState() {
        this.idleManager.reset();
        // Nếu đang hiện gợi ý thì ẩn đi ngay lập tức
        if (this.isHintActive && this.handHint) {
            this.isHintActive = false;
            this.tweens.killTweensOf(this.handHint);
            this.handHint.setAlpha(0).setPosition(-200, -200);
        }
    }

    /**
     * Hiển thị bàn tay gợi ý (Được gọi từ IdleManager khi user không làm gì)
     */
    private showIdleHint() {
        if (!this.isGameActive || this.isHintActive) return;
        
        // Tìm vật thể nào là đáp án đúng
        const correctItem = this.puzzleItems.find(i => i.getData('isCorrect') === true);
        if (!correctItem) return;

        this.isHintActive = true;
        
        // Đặt vị trí xuất phát cho bàn tay (từ ngoài màn hình bay vào)
        this.handHint.setPosition(GameUtils.getW(this) + 100, GameUtils.getH(this));
        this.handHint.setAlpha(0);

        const IDLE = GameConstants.IDLE;
        
        // Chuỗi hiệu ứng: Hiện ra -> Chỉ vào đáp án -> Ấn ấn -> Biến mất
        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: correctItem.x + IDLE.OFFSET_X, y: correctItem.y + IDLE.OFFSET_Y, duration: IDLE.FADE_IN, ease: 'Power2' },
                { scale: 0.5, duration: IDLE.SCALE, yoyo: true, repeat: 2 }, // Ấn 2 lần
                { alpha: 0, duration: IDLE.FADE_OUT, onComplete: () => {
                        // Kết thúc gợi ý -> Reset lại vòng lặp idle
                        this.isHintActive = false;
                        this.idleManager.reset(); 
                        this.handHint.setPosition(-200, -200);
                    }
                }
            ]
        });
    }

    /**
     * Public method: Gọi từ bên ngoài (ví dụ nút Replay) để nghe lại hướng dẫn
     */
    public restartIntro() {
        if (this.instructionTimer) { this.instructionTimer.remove(false); this.instructionTimer = undefined; }
        this.resetIdleState(); 
        this.idleManager.stop(); 
        this.initGameFlow(); // Chạy lại từ đầu luồng game
    }

}