import Phaser from 'phaser';
import { showGameButtons, hideGameButtons } from '../main';
import AudioManager from '../audio/AudioManager';
import { changeBackground } from './utils/backgroundManager';
import { playVoiceLocked, resetVoiceState, setGameSceneReference } from '../rotateOrientation';

// --- DỮ LIỆU TRÒ CHƠI ---
interface ItemData {
    id: string;   
    name: string;
}

const GAME_ITEMS: Record<string, ItemData> = {
    'grape':   { id: 'grape',   name: 'Quả nho' },
    'bee':     { id: 'bee',     name: 'Con ong' },
    'volleyball':  { id: 'volleyball',  name: 'Bóng chuyền'},
    'stonke':  { id: 'stonke',  name: 'Con cò'  },
    'dog':     { id: 'dog',     name: 'Con chó' },
    'letter_o':{ id: 'letter_o',name: 'Chữ O'   },
    'cow':     { id: 'cow',     name: 'Con bò'  },
    'rabbit':  { id: 'rabbit',  name: 'Con thỏ' },
    'whistle': { id: 'whistle', name: 'Cái còi' },
    'empty':   { id: 'empty',   name: 'Bóng rỗng' }
};

interface GameState {
    score: number;
    maxScore: number;
    isPlaying: boolean;
    isPaused: boolean;
}

export default class GameScene extends Phaser.Scene {
    // --- PROPERTIES ---
    private boy!: Phaser.GameObjects.Sprite;
    private hand!: Phaser.GameObjects.Sprite;
    private bgm!: Phaser.Sound.BaseSound;
    
    // Score Bar Variables
    private scoreBarMask!: Phaser.GameObjects.Graphics;
    private scoreBarFill!: Phaser.GameObjects.Sprite;
    private maxScoreWidth: number = 0;

    // UI Elements
    private popupContainer!: Phaser.GameObjects.Container; 
    
    private state: GameState = { score: 0, maxScore: 10, isPlaying: false, isPaused: false };
    private spawnTimer?: Phaser.Time.TimerEvent;
    private activeTweens: Phaser.Tweens.Tween[] = [];
    private balloonColors = ['red', 'blue', 'green', 'yellow', 'purple'];
    private isInstructionCompleted: boolean = false;

    constructor() { super('GameScene'); }

    private getW() { 
        return this.scale.width; 
    }
    private getH() { 
        return this.scale.height; 
    }
    private pctX(p: number) { 
        return this.getW() * p; 
    }
    private pctY(p: number) { 
        return this.getH() * p; 
    }

    init() {
        this.state = { score: 0, maxScore:10, isPlaying: false, isPaused: false };
        this.activeTweens = [];
        this.isInstructionCompleted = false; // Đặt lại trạng thái hướng dẫn
    }

    preload() {
        //AudioManager.loadAll();

        this.load.image('text_banner', 'assets/images/text_banner_game.png');
        this.load.image('bar_frame', 'assets/images/bar_frame.png');      
        this.load.image('bar_fill', 'assets/images/bar_fill.png');
        this.load.image('boy1', 'assets/images/boy1.png');
        this.load.image('boy2', 'assets/images/boy2.png');
        this.load.image('banner', 'assets/images/banner.png');
        this.load.image('hand', 'assets/images/hand.png');
        this.load.image('board', 'assets/images/board.png'); 
        this.load.image('icon_balloon', 'assets/images/icon_ball.png');
        this.load.audio('bgm-nen', 'assets/audio/nhac_nen.mp3');
        

        this.balloonColors.forEach(c => this.load.image(`balloon_${c}`, `assets/images/balloon_${c}.png`));

        Object.values(GAME_ITEMS).forEach(item => {
            if (item.id === 'empty') return; 
            this.load.image(`item_${item.id}`, `assets/images/${item.id}.png`); 
            this.load.image(`text_${item.id}`, `assets/images/text_${item.id}.png`);
        });
    }

    create() {
        resetVoiceState(); 
        (window as any).gameScene = this;
        setGameSceneReference(this);
        changeBackground('assets/images/bg_game.jpg');

        this.createBoy();
        this.createScoreBar(); 
        this.createPopupUI(); 
        this.createBannerAndTutorial(); 

        // Khóa input bàn phím (nếu có)
        if (this.input.keyboard) {
            this.input.keyboard.enabled = false;
        }

        // --- HÀM LOGIC: BẮT ĐẦU ÂM THANH & GAME ---
        // (Được tách ra để có thể gọi ngay lập tức HOẶC gọi sau khi click)

        this.bgm = this.sound.add('bgm-nen', { 
            loop: true, 
            volume: 0.2 
        });

        const startGameFlow = () => {
            if (!this.bgm.isPlaying) {
                this.bgm.play();
            }
            try { 
                playVoiceLocked(null as any, 'instruction'); 
            } catch (e) { 
                console.warn('Error playing instruction voice:', e); 
            }

            // Mở lại bàn phím
            if (this.input.keyboard) {
                this.input.keyboard.enabled = true;
            }
            showGameButtons();
        };
        AudioManager.loadAll().then(() => {

            console.log("Audio Loaded Fully!"); // Debug
        // TRƯỜNG HỢP 1: Đã unlock âm thanh từ trước
            if (AudioManager.isUnlocked) {
                startGameFlow();
            } 
        // TRƯỜNG HỢP 2: Mới vào game lần đầu -> Âm thanh bị khóa -> CHỜ CLICK
            else {
                this.input.once('pointerdown', () => {
                    AudioManager.unlockAudio(); 
                    startGameFlow();
                }, this);
            }
        });
    }

    // --- SETUP UI ---

    private createBoy() {
        if (!this.anims.exists('run')) {
            this.anims.create({ key: 'run', frames: [{ key: 'boy1' }, { key: 'boy2' }], frameRate: 4, repeat: -1 });
        }
        this.boy = this.add.sprite(this.pctX(0.5), this.pctY(0.95), 'boy1').setOrigin(0.5, 1);
    }


    private createScoreBar() {

        const barX = this.pctX(0.12); 
        const barY = this.pctY(0.9);

        
        // Khung nền
        const barFrame = this.add.image(barX, barY, 'bar_frame').setOrigin(0, 0.5);
        this.scoreBarFill = this.add.sprite(barX, barY, 'bar_fill').setOrigin(0, 0.5);

        // Lưu lại chiều rộng gốc thanh bar
        this.maxScoreWidth = this.scoreBarFill.width;

        // Tạo MASK (Mặt nạ cắt thanh xanh)
        this.scoreBarMask = this.make.graphics({});
        this.scoreBarMask.fillStyle(0xffffff);
        this.scoreBarMask.beginPath();
        
        //Mask ban đầu với chiều rộng 0 (ẩn hoàn toàn)
        this.scoreBarMask.fillRect(barX, barY - this.scoreBarFill.height / 2, 0, this.scoreBarFill.height);
        
        // Áp dụng mask
        const mask = this.scoreBarMask.createGeometryMask();
        this.scoreBarFill.setMask(mask);

        //VẼ ICON
        const icon = this.add.image(barX - 10, barY, 'icon_balloon');
    }

    private createPopupUI() {
        this.popupContainer = this.add.container(this.getW() / 2, this.getH() / 2).setDepth(1000).setVisible(false);

        const bg = this.add.image(0, 0, 'board').setName('popup_board');
        
        const icon = this.add.image(0, -bg.displayHeight * 15, 'item_grape').setName('popup_icon');
        const textImg = this.add.image(0, bg.displayHeight * 0.22, 'text_grape').setName('popup_text_img');

        this.popupContainer.add([bg, icon, textImg]);
    }

    // --- GAME LOGIC ---

    private createBannerAndTutorial() {

        // Banner
        const banner = this.add.image(this.pctX(0.5), this.pctY(0.1), 'banner').setName('banner'); //
        banner.setScale((this.getW() * 0.6) / banner.width);

        // Text
        const bannerText = this.add.image(this.pctX(0.5), this.pctY(0.1), 'text_banner').setName('banner_text');
        bannerText.setScale((this.getW() * 0.5) / bannerText.width);

        // Bóng hướng dẫn
        const tutorialBalloon = this.createBalloonContainer('balloon_purple', 'letter_o');
        tutorialBalloon.setPosition(this.pctX(0.5), this.pctY(0.4));
        
        // Tay chỉ + Animate
        this.hand = this.add.sprite(this.pctX(0.55), this.pctY(0.48), 'hand');
        this.hand.setDisplaySize(this.getW() * 0.08, this.getW() * 0.08);
        this.tweens.add({ targets: this.hand, x: this.pctX(0.55), y: this.pctY(0.47), duration: 350, yoyo: true, repeat: -1 });

        // Thiết lập tương tác cho bóng hướng dẫn
        const hitArea = tutorialBalloon.getAt(0) as Phaser.GameObjects.Sprite;
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.once('pointerdown', () => {
            tutorialBalloon.destroy();
            AudioManager.stop('instruction');
            AudioManager.play('letter_o');
            if (this.hand) this.hand.destroy();

            this.tweens.add({ 
                targets: [banner, bannerText], y: -100, alpha: 0, duration: 500,
                onComplete: () => { banner.destroy(); bannerText.destroy(); }
            });
            
            if (this.boy) this.boy.play('run');
            this.isInstructionCompleted = true;
            this.state.isPlaying = true;
            this.startGameLoop();
        });
    }

    startGameLoop() {
        this.spawnTimer = this.time.addEvent({
            delay: 2000, callback: this.spawnBalloon, callbackScope: this, loop: true
        });
    }

    spawnBalloon() {
        if (!this.state.isPlaying || this.state.isPaused) return;

        //DATA CỦA 3 BÓNG (3 đúng, 1 rỗng)
        const allItemKeys = Object.keys(GAME_ITEMS).filter(key => key !== 'empty');
        const correctItems = Phaser.Utils.Array.Shuffle(allItemKeys).slice(0, 3); 
        let spawnIDs = [...correctItems, 'empty'];
        spawnIDs = Phaser.Utils.Array.Shuffle(spawnIDs);

        // CẤU HÌNH 4 VỊ TRÍ X CỐ ĐỊNH 
        const slotPositions = [
            this.pctX(0.15), // 15%
            this.pctX(0.40), // 40%
            this.pctX(0.65), // 65%
            this.pctX(0.85)  // 85%
        ];
        const shuffledSlots = Phaser.Utils.Array.Shuffle(slotPositions);

        // Tạo 4 bóng với itemID tương ứng
        spawnIDs.forEach((itemID, index) => {
            const color = Phaser.Utils.Array.GetRandom(this.balloonColors);
            const container = this.createBalloonContainer(`balloon_${color}`, itemID, true);
            container.setData('itemID', itemID);

            // Lấy kích thước ban đầu để tính toán vị trí bay
            const ballSprite = container.getAt(0) as Phaser.GameObjects.Sprite;
            const baseBallHeight = ballSprite.height * (this.getH() * 0.18 / ballSprite.height);

            //Đặt vị trí BẮT ĐẦU VÀ KẾT THÚC ---
            const base_X = shuffledSlots[index];
            const startX = base_X + Phaser.Math.Between(-20, 20);
            const startY = this.getH() - baseBallHeight*0.8; // Vị trí xuất hiện đột ngột
            container.setPosition(startX, startY);

            const endY = baseBallHeight / 2 + baseBallHeight * 0.1; // Vị trí biến mất đột ngột
            const flyDuration = Phaser.Math.Between(4000, 6000); 
            const swingRange = 30; 
            const swingToX = base_X + Phaser.Math.Between(-swingRange, swingRange);

            //TWEEN XUẤT HIỆN ĐẸP MẮT
            const appearTween = this.tweens.add({
                targets: container, 
                scale: 1,
                duration: 400,
                ease: 'Back.Out',
                onComplete: (tween, targets) => {
                    const targetContainer = targets[0];
                    
                    // TWEEN BAY LÊN (Trục Y)
                    const flyTween = this.tweens.add({
                        targets: targetContainer, 
                        y: endY, 
                        duration: flyDuration, 
                        ease: 'Linear',
                        onComplete: (ft) => { 
                            const relatedTweens = this.activeTweens.filter(t => t.targets === targetContainer);
                            relatedTweens.forEach(t => t.stop()); 
                            
                            this.activeTweens = this.activeTweens.filter(t => t.targets !== targetContainer);
                            targetContainer.destroy(); 
                        }
                    });
                    this.activeTweens.push(flyTween);

                    // TWEEN LẮC LƯ (Trục X)
                    const swingTween = this.tweens.add({
                        targets: targetContainer,
                        x: swingToX, 
                        duration: 1200, 
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    this.activeTweens.push(swingTween);

                    this.activeTweens = this.activeTweens.filter(t => t !== appearTween);
                }
            });
            this.activeTweens.push(appearTween);

            // Gắn sự kiện click
            (container.getAt(0) as Phaser.GameObjects.Sprite).on('pointerdown', () => this.handleBalloonClick(container, itemID));
        });
    }

    // Tạo container bóng với màu sắc và itemID
    createBalloonContainer(balloonKey: string, itemID: string, startHidden: boolean = false) {
        const container = this.add.container(0, 0);

        if (startHidden) {
            container.setScale(0);
        }
        
        const baseSize = this.getH() * 0.18; 

        const balloon = this.add.sprite(0, 0, balloonKey);
        balloon.setScale(0.65).setInteractive({ useHandCursor: true });
        container.add(balloon);

        //CHỈ THÊM HÌNH NẾU KHÔNG PHẢI LÀ BÓNG RỖNG
        if (itemID !== 'empty') {
            if(itemID == 'whistle'){
                const item = this.add.sprite(0, 0, `item_${itemID}`);
                item.setScale(0.35);
                container.add(item);
            }
            else{
                const item = this.add.sprite(0, -baseSize * 0.1, `item_${itemID}`);
                item.setScale(0.35);
                container.add(item);
            }
        }
        
        return container;
    }

    handleBalloonClick(container: Phaser.GameObjects.Container, itemID: string) {
        if (this.state.isPaused) return;

        if (itemID === 'empty') {
                try { AudioManager.play('sfx-wrong') } catch {}

                // Hiệu ứng lắc lư mạnh và biến mất 
                this.tweens.add({
                    targets: container,
                    x: container.x + Phaser.Math.Between(-30, 30),
                    y: container.y + Phaser.Math.Between(-30, 30),
                    duration: 100,
                    yoyo: true,
                    repeat: 3, // Lắc 3 lần
                    onComplete: () => {
                        container.destroy();
                    }
                });
                
                return; 
            }
        try { AudioManager.play('sfx-correct'); } catch {}
        this.state.isPaused = true;
        this.activeTweens.forEach(t => t.pause());
        if (this.boy) this.boy.stop();
        if (this.spawnTimer) this.spawnTimer.paused = true;
        
        try { AudioManager.play(itemID); } catch {}

        const data = GAME_ITEMS[itemID];
        
        if (data) {
            const bg = this.popupContainer.getByName('popup_board') as Phaser.GameObjects.Image;
            const icon = this.popupContainer.getByName('popup_icon') as Phaser.GameObjects.Image;
            const textImg = this.popupContainer.getByName('popup_text_img') as Phaser.GameObjects.Image;

            if (bg && icon && textImg) {
                icon.setTexture(`item_${data.id}`).setScale(0.8);
                icon.y = -bg.displayHeight * 0.15;
    
                textImg.setTexture(`text_${data.id}`);
                const maxTextWidth = bg.displayWidth * 0.6;
                textImg.y = bg.displayHeight * 0.22; 
            }
        }

        this.popupContainer.setVisible(true).setScale(0);
        this.tweens.add({ targets: this.popupContainer, scale: 1, duration: 300, ease: 'Back.out' });

        //Gọi hàm tăng điểm và kiểm tra thắng thua
        this.increaseScore(); 
        
        container.destroy();

        this.time.delayedCall(2000, () => {
            this.hidePopup();
        });
    }

    hidePopup() {
        this.tweens.add({
            targets: this.popupContainer, scale: 0, duration: 200,
            onComplete: () => {
                this.popupContainer.setVisible(false);
                
                // Chỉ resume game nếu chưa thắng
                if (this.state.isPlaying) {
                    this.state.isPaused = false;
                    this.activeTweens.forEach(t => t.resume());
                    if (this.spawnTimer) this.spawnTimer.paused = false;
                    this.boy.play('run');
                }
            }
        });
    }

    increaseScore() {
        if (this.state.score < this.state.maxScore) {
            this.state.score++;
            
            //ruyền tham số current và total vào
            this.updateScoreBar(this.state.score, this.state.maxScore);
            
            //Kiểm tra điều kiện thắng
            if (this.state.score >= this.state.maxScore) {
                this.winGame();
            }
        }
    }

    public updateScoreBar(current: number, total: number) {
        let percent = current / total;
        if (percent > 1) percent = 1;

        const visibleWidth = this.maxScoreWidth * percent;

        this.scoreBarMask.clear(); 
        this.scoreBarMask.fillStyle(0xffffff); 
        this.scoreBarMask.beginPath();
        
        const x = this.scoreBarFill.x; 
        const y = this.scoreBarFill.y - this.scoreBarFill.height / 2; 
        
        this.scoreBarMask.fillRect(x, y, visibleWidth, this.scoreBarFill.height);
    }

    winGame() {
        console.log("WIN GAME!");
        this.state.isPlaying = false; 
        if (this.boy) this.boy.stop(); 
        if (this.spawnTimer) this.spawnTimer.remove(); 

        this.time.delayedCall(1000, () => {
            hideGameButtons();
            this.scene.start('EndGameScene'); 
        });
    }
}