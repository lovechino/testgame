import Phaser from 'phaser';
import { GameConstants } from '../../consts/GameConstants';
import { GameUtils } from '../../utils/GameUtils';
import { TextureKeys } from '../../consts/Keys';
import AudioManager from '../../audio/AudioManager';

export class Scene1UI {
    static createBanner(scene: Phaser.Scene) {
        const UI = GameConstants.SCENE1.UI;
        const cx = GameUtils.pctX(scene, 0.5);
        const bannerY = GameUtils.pctY(scene, UI.BANNER_Y);

        const bannerBg = scene.add.image(cx, bannerY, TextureKeys.S1_BannerBg)
            .setOrigin(0.5, 0).setScale(0.7);

        const textY = bannerY + bannerBg.displayHeight / 2;
        scene.add.image(cx, textY, TextureKeys.S1_BannerText).setScale(0.7);

        const handHint = scene.add.image(0, 0, TextureKeys.HandHint)
            .setDepth(200).setAlpha(0).setScale(0.7);

        return { bannerBg, handHint };
    }

    static createLeftPanel(scene: Phaser.Scene, bannerBg: Phaser.GameObjects.Image, isGameActive: () => boolean) {
        const UI = GameConstants.SCENE1.UI;
        const ANIM = GameConstants.SCENE1.ANIM;

        const boardY = bannerBg.displayHeight + GameUtils.pctY(scene, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(scene, 0.5) - GameUtils.pctY(scene, UI.BOARD_MARGIN_X);

        const boardLeft = scene.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(1, 0).setScale(0.7);

        const centerX = GameUtils.pctX(scene, 0.5 - boardLeft.displayWidth / GameUtils.getW(scene) / 2) - GameUtils.pctY(scene, UI.BOARD_MARGIN_X);
        const centerY = boardY + boardLeft.displayHeight / 2;
        const bottomY = boardY + boardLeft.displayHeight;

        const playerY = centerY + (boardLeft.displayHeight * UI.RAIN_OFFSET);
        const player = scene.add.image(centerX, playerY, TextureKeys.S1_Player)
            .setScale(0.7).setOrigin(0.5, 1);

        const poemY = bottomY - player.displayHeight - GameUtils.pctY(scene, UI.POEM_OFFSET);
        const poemText = scene.add.image(centerX, poemY, TextureKeys.S1_PoemText)
            .setScale(0.7).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });

        scene.tweens.add({ targets: poemText, y: '+=10', duration: ANIM.POEM_FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        poemText.on('pointerdown', () => {
            if (isGameActive()) {
                AudioManager.stopAll();
                AudioManager.play('cau_do');
                scene.tweens.add({ targets: poemText, scale: 0.6, duration: 100, yoyo: true, ease: 'Sine.easeInOut' });
            }
        });

        const iconX = centerX - boardLeft.displayWidth * UI.ICON_O_X;
        const iconY = boardY + GameUtils.pctY(scene, UI.ICON_O_Y);
        const iconO = scene.add.image(iconX, iconY, TextureKeys.S1_IconOHeader)
            .setScale(0.7).setOrigin(0.5, 0);

        scene.tweens.add({ targets: iconO, angle: { from: -4, to: 4 }, duration: ANIM.ICON_SHAKE, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    static createRightPanel(scene: Phaser.Scene, bannerBg: Phaser.GameObjects.Image, onPuzzleItemClick: (item: Phaser.GameObjects.Image, isCorrect: boolean) => void) {
        const UI = GameConstants.SCENE1.UI;

        const boardY = bannerBg.displayHeight + GameUtils.pctY(scene, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(scene, 0.5) + GameUtils.pctY(scene, UI.BOARD_MARGIN_X);

        const boardRight = scene.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(0, 0).setScale(0.7);

        const centerX = GameUtils.pctX(scene, 0.5 + boardRight.displayWidth / GameUtils.getW(scene) / 2) + GameUtils.pctY(scene, UI.BOARD_MARGIN_X);
        const centerY = boardY + boardRight.displayHeight / 2;

        const puzzleItems: Phaser.GameObjects.Image[] = [];

        const createItem = (x: number, y: number, key: string, isCorrect: boolean) => {
            const item = scene.add.image(x, y, key).setInteractive({ useHandCursor: true }).setScale(0.7);
            item.setData('isCorrect', isCorrect);

            scene.tweens.add({ targets: item, y: y - 10, duration: GameConstants.SCENE1.ANIM.FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

            item.on('pointerdown', () => {
                onPuzzleItemClick(item, isCorrect);
            });

            puzzleItems.push(item);
            return item;
        };

        const item1X = centerX - boardRight.displayWidth * UI.ITEM_OFFSET_X;
        const item1Y = centerY - boardRight.displayWidth * UI.ITEM_OFFSET_Y;
        createItem(item1X, item1Y, TextureKeys.S1_Engineer, true);

        const item2X = centerX - boardRight.displayWidth * UI.ITEM_OFFSET_X;
        const item2Y = centerY + boardRight.displayWidth * UI.ITEM_OFFSET_Y;
        createItem(item2X, item2Y, TextureKeys.S1_soccer, false);

        const item3X = centerX + boardRight.displayWidth * 0.25;
        const item3Y = centerY;
        createItem(item3X, item3Y, TextureKeys.S1_Police, true);

        const victoryBg = scene.add.image(centerX, centerY, TextureKeys.BgPopup).setScale(0).setDepth(20);
        const victoryText = scene.add.image(centerX, centerY + 220, TextureKeys.S1_TextResult).setAlpha(0).setDepth(21).setScale(0.8);

        return { puzzleItems, victoryBg, victoryText };
    }
}
