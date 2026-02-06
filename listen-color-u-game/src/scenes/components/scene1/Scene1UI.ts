import Phaser from 'phaser';
import { GameConstants } from '../../../consts/GameConstants';
import { TextureKeys } from '../../../consts/Keys';
import { GameUtils } from '../../../utils/GameUtils';
import AudioManager from '../../../audio/AudioManager';

export class Scene1UI {
    private scene: Phaser.Scene;

    // UI Elements
    private bannerBg!: Phaser.GameObjects.Image;
    private puzzleItems: Phaser.GameObjects.Image[] = [];
    private victoryBg!: Phaser.GameObjects.Image;
    private victoryText!: Phaser.GameObjects.Image;
    private handHint!: Phaser.GameObjects.Image;

    // Callbacks
    private onPuzzleItemClick: (item: Phaser.GameObjects.Image) => void;

    constructor(scene: Phaser.Scene, onPuzzleItemClick: (item: Phaser.GameObjects.Image) => void) {
        this.scene = scene;
        this.onPuzzleItemClick = onPuzzleItemClick;
    }

    public create() {
        this.createBanner();
        this.createHandHint();
        this.createLeftPanel();
        this.createRightPanel();
    }

    private createBanner() {
        const UI = GameConstants.SCENE1.UI;
        const cx = GameUtils.pctX(this.scene, 0.5);
        const bannerY = GameUtils.pctY(this.scene, UI.BANNER_Y);

        this.bannerBg = this.scene.add.image(cx, bannerY, TextureKeys.S1_BannerBg)
            .setOrigin(0.5, 0).setScale(0.7);

        const textY = bannerY + this.bannerBg.displayHeight / 2;
        this.scene.add.image(cx, textY, TextureKeys.S1_BannerText).setScale(0.7);
    }

    private createHandHint() {
        this.handHint = this.scene.add.image(0, 0, TextureKeys.HandHint)
            .setDepth(200).setAlpha(0).setScale(0.7);
    }

    private createLeftPanel() {
        const UI = GameConstants.SCENE1.UI;
        const ANIM = GameConstants.SCENE1.ANIM;

        const boardY = this.bannerBg.displayHeight + GameUtils.pctY(this.scene, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(this.scene, 0.5) - GameUtils.pctY(this.scene, UI.BOARD_MARGIN_X);

        const boardLeft = this.scene.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(1, 0).setScale(0.7);

        const centerX = GameUtils.pctX(this.scene, 0.5 - boardLeft.displayWidth / GameUtils.getW(this.scene) / 2) - GameUtils.pctY(this.scene, UI.BOARD_MARGIN_X);
        const centerY = boardY + boardLeft.displayHeight / 2;
        const bottomY = boardY + boardLeft.displayHeight;

        const playerY = centerY + (boardLeft.displayHeight * UI.RAIN_OFFSET);
        const player = this.scene.add.image(centerX, playerY, TextureKeys.S1_Player)
            .setScale(0.7).setOrigin(0.5, 1);

        const poemY = bottomY - player.displayHeight - GameUtils.pctY(this.scene, UI.POEM_OFFSET);
        const poemText = this.scene.add.image(centerX, poemY, TextureKeys.S1_PoemText)
            .setScale(0.7).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });

        this.scene.tweens.add({ targets: poemText, y: '+=10', duration: ANIM.POEM_FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        poemText.on('pointerdown', () => {
            // Dispatch event or call a handler passed in? 
            // Logic: Play audio only if game active. 
            // Ideally UI shouldn't know about game state 'active', but for interaction feedback it might need to check.
            // For now, let's keep simple logic here or expose an event. 
            // Reuse the puzzle click handler logic pattern if complex, but this triggers 'cau_do' audio.
            // We can emit an event on the scene.
            this.scene.events.emit('poem-clicked', poemText);
        });

        const iconX = centerX - boardLeft.displayWidth * UI.ICON_O_X;
        const iconY = boardY + GameUtils.pctY(this.scene, UI.ICON_O_Y);
        const iconO = this.scene.add.image(iconX, iconY, TextureKeys.S1_IconOHeader).setScale(0.7).setOrigin(0.5, 0);

        this.scene.tweens.add({ targets: iconO, angle: { from: -4, to: 4 }, duration: ANIM.ICON_SHAKE, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    private createRightPanel() {
        const UI = GameConstants.SCENE1.UI;

        const boardY = this.bannerBg.displayHeight + GameUtils.pctY(this.scene, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(this.scene, 0.5) + GameUtils.pctY(this.scene, UI.BOARD_MARGIN_X);

        const boardRight = this.scene.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(0, 0).setScale(0.7);

        const centerX = GameUtils.pctX(this.scene, 0.5 + boardRight.displayWidth / GameUtils.getW(this.scene) / 2) + GameUtils.pctY(this.scene, UI.BOARD_MARGIN_X);
        const centerY = boardY + boardRight.displayHeight / 2;

        this.puzzleItems = [];

        const item1X = centerX - boardRight.displayWidth * UI.ITEM_OFFSET_X;
        const item1Y = centerY - boardRight.displayWidth * UI.ITEM_OFFSET_Y;
        this.createPuzzleItem(item1X, item1Y, TextureKeys.S1_enginer, false);

        const item2X = centerX - boardRight.displayWidth * UI.ITEM_OFFSET_X;
        const item2Y = centerY + boardRight.displayWidth * UI.ITEM_OFFSET_Y;
        this.createPuzzleItem(item2X, item2Y, TextureKeys.S1_soccer, true);

        const item3X = centerX + boardRight.displayWidth * 0.25;
        const item3Y = centerY;
        this.createPuzzleItem(item3X, item3Y, TextureKeys.S1_doctor, false);

        this.victoryBg = this.scene.add.image(centerX, centerY, TextureKeys.BgPopup).setScale(0).setDepth(20);
        this.victoryText = this.scene.add.image(centerX, centerY + 220, TextureKeys.S1_TextResult).setAlpha(0).setDepth(21).setScale(0.8);
    }

    private createPuzzleItem(x: number, y: number, key: string, isCorrect: boolean) {
        const item = this.scene.add.image(x, y, key).setInteractive({ useHandCursor: true }).setScale(0.7);
        item.setData('isCorrect', isCorrect);

        this.scene.tweens.add({ targets: item, y: y - 10, duration: GameConstants.SCENE1.ANIM.FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        item.on('pointerdown', () => {
            this.onPuzzleItemClick(item);
        });

        this.puzzleItems.push(item);
        return item;
    }

    // --- Public Animation Methods ---

    public animatePoemClick(poemText: Phaser.GameObjects.Image) {
        this.scene.tweens.add({ targets: poemText, scale: 0.6, duration: 100, yoyo: true, ease: 'Sine.easeInOut' });
    }

    public animateWrong(item: Phaser.GameObjects.Image) {
        this.scene.tweens.add({
            targets: item,
            angle: { from: -10, to: 10 },
            duration: GameConstants.SCENE1.ANIM.WRONG_SHAKE,
            yoyo: true,
            repeat: 3,
            onComplete: () => { item.angle = 0; }
        });
    }

    public animateVictory(winnerItem: Phaser.GameObjects.Image, onComplete: () => void) {
        this.puzzleItems.forEach(i => i.disableInteractive());
        this.scene.tweens.killTweensOf(winnerItem);

        this.puzzleItems.forEach(i => {
            if (i !== winnerItem) this.scene.tweens.add({ targets: i, alpha: 0, scale: 0, duration: 300 });
        });

        const ANIM = GameConstants.SCENE1.ANIM;
        this.scene.tweens.add({ targets: this.victoryBg, scale: 0.9, duration: ANIM.WIN_POPUP, ease: 'Back.out' });
        this.scene.tweens.add({ targets: this.victoryText, alpha: 1, y: this.victoryText.y - 20, duration: ANIM.WIN_POPUP });

        winnerItem.setDepth(100);
        this.scene.tweens.add({
            targets: winnerItem,
            x: this.victoryBg.x,
            y: this.victoryBg.y - 100,
            scale: 0.7,
            duration: ANIM.WIN_POPUP,
            ease: 'Back.out',
            onComplete: onComplete
        });
    }

    public showIdleHint(correctItem: Phaser.GameObjects.Image) {
        const IDLE = GameConstants.IDLE;
        this.handHint.setPosition(GameUtils.getW(this.scene) + 100, GameUtils.getH(this.scene));
        this.handHint.setAlpha(0);

        this.scene.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: correctItem.x + IDLE.OFFSET_X, y: correctItem.y + IDLE.OFFSET_Y, duration: IDLE.FADE_IN, ease: 'Power2' },
                { scale: 0.5, duration: IDLE.SCALE, yoyo: true, repeat: 2 },
                {
                    alpha: 0, duration: IDLE.FADE_OUT, onComplete: () => {
                        this.scene.events.emit('hint-finished');
                        this.handHint.setPosition(-200, -200);
                    }
                }
            ]
        });
    }

    public hideHandHint() {
        this.scene.tweens.killTweensOf(this.handHint);
        this.handHint.setAlpha(0).setPosition(-200, -200);
    }

    public getPuzzleItems(): Phaser.GameObjects.Image[] {
        return this.puzzleItems;
    }
}
