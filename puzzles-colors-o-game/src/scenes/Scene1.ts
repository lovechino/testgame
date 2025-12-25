import Phaser from 'phaser';

import { SceneKeys, TextureKeys, AudioKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants'; // Import
import { GameUtils } from '../utils/GameUtils';
import { IdleManager } from '../utils/IdleManager';

import AudioManager from '../audio/AudioManager';
import { showGameButtons } from '../main';
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation'; 
import { changeBackground } from '../utils/BackgroundManager';

export default class Scene1 extends Phaser.Scene {
    private puzzleItems: Phaser.GameObjects.Image[] = [];
    private victoryBg!: Phaser.GameObjects.Image;
    private victoryText!: Phaser.GameObjects.Image;
    private bannerBg!: Phaser.GameObjects.Image;
    private handHint!: Phaser.GameObjects.Image;

    private isGameActive: boolean = false;
    private bgm!: Phaser.Sound.BaseSound;
    private idleManager!: IdleManager;
    private isHintActive: boolean = false;
    private instructionTimer?: Phaser.Time.TimerEvent;

    constructor() { super(SceneKeys.Scene1); }

    create() {
        this.setupSystem();
        this.setupBackgroundAndAudio();
        this.createUI();
        this.createGameObjects();
        this.initGameFlow();

        this.events.on('wake', () => {
            this.idleManager.reset();
            if (this.input.keyboard) this.input.keyboard.enabled = true;
            if (!this.bgm.isPlaying) this.bgm.play();
        });
    }

    update(time: number, delta: number) {
        this.idleManager.update(delta);
    }

    private setupSystem() {
        resetVoiceState();
        (window as any).gameScene = this;
        setGameSceneReference(this);

        // Sử dụng IDLE.THRESHOLD
        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => {
            this.showIdleHint();
        });

        this.input.on('pointerdown', () => {
            this.resetIdleState();
        });
    }

    private setupBackgroundAndAudio() {
        changeBackground('assets/images/bg/backgroud_game.jpg'); 
        if (this.sound.get(AudioKeys.BgmNen)) {
            this.sound.stopByKey(AudioKeys.BgmNen);
        }
        this.bgm = this.sound.add(AudioKeys.BgmNen, { loop: true, volume: 0.25 });
    }

    private createUI() {
        const UI = GameConstants.SCENE1.UI;
        const cx = GameUtils.pctX(this, 0.5);
        
        // --- TÍNH TOÁN BIẾN TRUNG GIAN ---
        const bannerY = GameUtils.pctY(this, UI.BANNER_Y);

        this.bannerBg = this.add.image(cx, bannerY, TextureKeys.S1_BannerBg)
            .setOrigin(0.5, 0).setScale(0.7);
        
        // Tính toán sau khi banner đã add
        const textY = bannerY + this.bannerBg.displayHeight / 2;
        this.add.image(cx, textY, TextureKeys.S1_BannerText).setScale(0.7);

        this.handHint = this.add.image(0, 0, TextureKeys.HandHint)
            .setDepth(200).setAlpha(0).setScale(0.7);
    }

    private createGameObjects() {
        this.createLeftPanel();
        this.createRightPanel();
    }

    private createLeftPanel() { 
        const UI = GameConstants.SCENE1.UI;
        const ANIM = GameConstants.SCENE1.ANIM;

        // 1. Vị trí Bảng
        const boardY = this.bannerBg.displayHeight + GameUtils.pctY(this, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(this, 0.5) - GameUtils.pctY(this, UI.BOARD_MARGIN_X);
        
        const boardLeft = this.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(1, 0).setScale(0.7);

        // 2. Center
        const centerX = GameUtils.pctX(this, 0.5 - boardLeft.displayWidth / GameUtils.getW(this) / 2) - GameUtils.pctY(this, UI.BOARD_MARGIN_X);
        const centerY = boardY + boardLeft.displayHeight / 2;
        const bottomY = boardY + boardLeft.displayHeight;

        // 3. Mưa (Tính toán sạch)
        const rainY = centerY + (boardLeft.displayHeight * UI.RAIN_OFFSET);
        const rain = this.add.image(centerX, rainY, TextureKeys.S1_Rain)
            .setScale(0.7).setOrigin(0.5, 1);

        // 4. Bài thơ
        const poemY = bottomY - rain.displayHeight - GameUtils.pctY(this, UI.POEM_OFFSET);
        const poemText = this.add.image(centerX, poemY, TextureKeys.S1_PoemText)
            .setScale(0.7).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });

        this.tweens.add({ targets: poemText, y: '+=10', duration: ANIM.POEM_FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        
        poemText.on('pointerdown', () => {
            if (this.isGameActive) {
                AudioManager.stopAll();
                AudioManager.play('cau_do');
                this.tweens.add({ targets: poemText, scale: 0.6, duration: 100, yoyo: true, ease: 'Sine.easeInOut' });
            }
        });

        // 5. Icon O
        const iconX = centerX - boardLeft.displayWidth * UI.ICON_O_X;
        const iconY = boardY + GameUtils.pctY(this, UI.ICON_O_Y);
        const iconO = this.add.image(iconX, iconY, TextureKeys.S1_IconOHeader)
            .setScale(0.7).setOrigin(0.5, 0);

        this.tweens.add({ targets: iconO, angle: { from: -4, to: 4 }, duration: ANIM.ICON_SHAKE, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    private createRightPanel() {
        const UI = GameConstants.SCENE1.UI;

        // 1. Bảng Phải
        const boardY = this.bannerBg.displayHeight + GameUtils.pctY(this, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(this, 0.5) + GameUtils.pctY(this, UI.BOARD_MARGIN_X);
        
        const boardRight = this.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(0, 0).setScale(0.7);

        // 2. Center
        const centerX = GameUtils.pctX(this, 0.5 + boardRight.displayWidth / GameUtils.getW(this) / 2) + GameUtils.pctY(this, UI.BOARD_MARGIN_X);
        const centerY = boardY + boardRight.displayHeight / 2;

        this.puzzleItems = [];

        // 3. Tính toán vị trí Items (Biến trung gian)
        const item1X = centerX - boardRight.displayWidth * UI.ITEM_OFFSET_X;
        const item1Y = centerY - boardRight.displayWidth * UI.ITEM_OFFSET_Y;
        this.createPuzzleItem(item1X, item1Y, TextureKeys.S1_ItemUmbrella, true);

        const item2X = centerX - boardRight.displayWidth * UI.ITEM_OFFSET_X;
        const item2Y = centerY + boardRight.displayWidth * UI.ITEM_OFFSET_Y;
        this.createPuzzleItem(item2X, item2Y, TextureKeys.S1_ItemMushroom, false);

        const item3X = centerX + boardRight.displayWidth * 0.25; 
        const item3Y = centerY;
        this.createPuzzleItem(item3X, item3Y, TextureKeys.S1_ItemLamp, false);

        this.victoryBg = this.add.image(centerX, centerY, TextureKeys.BgPopup).setScale(0).setDepth(20);
        this.victoryText = this.add.image(centerX, centerY + 220, TextureKeys.S1_TextResult).setAlpha(0).setDepth(21).setScale(0.8);
    }

    private createPuzzleItem(x: number, y: number, key: string, isCorrect: boolean) {
        const item = this.add.image(x, y, key).setInteractive({ useHandCursor: true }).setScale(0.7);
        item.setData('isCorrect', isCorrect);

        this.tweens.add({ targets: item, y: y - 10, duration: GameConstants.SCENE1.ANIM.FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        item.on('pointerdown', () => {
            if (!this.isGameActive) return;
            isCorrect ? this.handleCorrect(item) : this.handleWrong(item);
        });

        this.puzzleItems.push(item);
        return item;
    }

    private initGameFlow() {
        if (this.input.keyboard) this.input.keyboard.enabled = false;

        const startAction = () => {
            if (!this.bgm.isPlaying) this.bgm.play();
            
            this.isGameActive = true;
            playVoiceLocked(null, 'instruction');
            const instructionTime = AudioManager.getDuration('instruction') + 0.5;

            this.instructionTimer = this.time.delayedCall(instructionTime * 1000, () => {
                if (this.isGameActive) {
                    playVoiceLocked(null, 'cau_do');
                    const riddleDuration = AudioManager.getDuration('cau_do');

                    this.time.delayedCall((riddleDuration * 1000) + GameConstants.SCENE1.TIMING.DELAY_IDLE, () => {
                        if (this.isGameActive) {
                            this.idleManager.start(); 
                        }
                    });
                }
            });

            if (this.input.keyboard) this.input.keyboard.enabled = true;
            showGameButtons();
        };

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

    handleWrong(item: Phaser.GameObjects.Image) {
        AudioManager.play('sfx-wrong')
        this.tweens.add({
            targets: item,
            angle: { from: -10, to: 10 },
            duration: GameConstants.SCENE1.ANIM.WRONG_SHAKE,
            yoyo: true,
            repeat: 3,
            onComplete: () => { item.angle = 0; }
        });
    }

    private handleCorrect(winnerItem: Phaser.GameObjects.Image) {
        this.isGameActive = false;
        if (this.instructionTimer) this.instructionTimer.remove(false);
        this.idleManager.stop(); 

        this.puzzleItems.forEach(i => i.disableInteractive());
        this.tweens.killTweensOf(winnerItem);

        AudioManager.stop('instruction');
        AudioManager.stop('cau_do');
        AudioManager.play('sfx-ting');

        this.puzzleItems.forEach(i => {
            if (i !== winnerItem) this.tweens.add({ targets: i, alpha: 0, scale: 0, duration: 300 });
        });

        const ANIM = GameConstants.SCENE1.ANIM;
        this.tweens.add({ targets: this.victoryBg, scale: 0.9, duration: ANIM.WIN_POPUP, ease: 'Back.out' });
        this.tweens.add({ targets: this.victoryText, alpha: 1, y: this.victoryText.y - 20, duration: ANIM.WIN_POPUP });

        winnerItem.setDepth(100);
        this.tweens.add({
            targets: winnerItem,
            x: this.victoryBg.x,
            y: this.victoryBg.y - 100,
            scale: 0.7,
            duration: ANIM.WIN_POPUP,
            ease: 'Back.out',
            onComplete: () => {
                playVoiceLocked(null, 'voice_cai_o');
                this.time.delayedCall(GameConstants.SCENE1.TIMING.DELAY_CORRECT_SFX, () => {
                    AudioManager.play('sfx-correct');
                    const khenTime = AudioManager.getDuration('sfx-correct');
                    this.time.delayedCall(khenTime * 1000, () => {
                        this.nextScene();
                    });
                });
            }
        });
    }

    private resetIdleState() {
        this.idleManager.reset();
        if (this.isHintActive && this.handHint) {
            this.isHintActive = false;
            this.tweens.killTweensOf(this.handHint);
            this.handHint.setAlpha(0).setPosition(-200, -200);
        }
    }

    private showIdleHint() {
        if (!this.isGameActive || this.isHintActive) return;
        const correctItem = this.puzzleItems.find(i => i.getData('isCorrect') === true);
        if (!correctItem) return;

        this.isHintActive = true;
        this.handHint.setPosition(GameUtils.getW(this) + 100, GameUtils.getH(this));
        this.handHint.setAlpha(0);

        const IDLE = GameConstants.IDLE;
        
        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: correctItem.x + IDLE.OFFSET_X, y: correctItem.y + IDLE.OFFSET_Y, duration: IDLE.FADE_IN, ease: 'Power2' },
                { scale: 0.5, duration: IDLE.SCALE, yoyo: true, repeat: 2 },
                { alpha: 0, duration: IDLE.FADE_OUT, onComplete: () => {
                        this.isHintActive = false;
                        this.idleManager.reset(); 
                        this.handHint.setPosition(-200, -200);
                    }
                }
            ]
        });
    }

    public restartIntro() {
        if (this.instructionTimer) { this.instructionTimer.remove(false); this.instructionTimer = undefined; }
        this.resetIdleState(); this.idleManager.stop(); this.initGameFlow();
    }

    private nextScene() {
        this.time.delayedCall(GameConstants.SCENE1.TIMING.DELAY_NEXT, () => {
            this.scene.start(SceneKeys.Scene2);
        });
    }
}