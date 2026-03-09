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

        // Ribbon banner (text is already baked into this texture in the reskin)
        const bannerBg = scene.add.image(cx, bannerY, TextureKeys.S1_BannerBg).setOrigin(0.5, 0);
        bannerBg.setScale(0.8);

        // Banner frame (decorative wrap) - Increased to 0.8 as requested
        this.createBannerFrame(scene, cx, bannerY, bannerBg);

        const handHint = scene.add.image(0, 0, TextureKeys.HandHint).setDepth(200).setAlpha(0).setScale(0.8);

        return { bannerBg, handHint };
    }

    private static createBannerFrame(scene: Phaser.Scene, cx: number, bannerY: number, bannerBg: Phaser.GameObjects.Image) {
        if (scene.textures.exists(TextureKeys.BannerFrame)) {
            const centerX = cx;
            const centerY = bannerY + (bannerBg.displayHeight / 2);

            // Shortened width (X-scale) to 0.65, while keeping Y-scale at 0.8
            scene.add.image(centerX, centerY, TextureKeys.BannerFrame)
                .setOrigin(0.5, 0.5)
                .setDepth(bannerBg.depth - 1)
                .setScale(0.65, 0.8);
        }
    }

    /**
     * Calculates a single targetScaleX that ensures both boards are wide enough 
     * for their respective content, resulting in a symmetrical layout.
     */
    static calculateUnifiedScale(scene: Phaser.Scene, itemsData: any[]) {
        let boardBaseWidth = 500;
        if (scene.textures.exists(TextureKeys.S1_Board)) {
            boardBaseWidth = scene.textures.get(TextureKeys.S1_Board).getSourceImage().width;
        }

        // 1. Check Left Content (Player)
        let playerWidth = 300;
        if (scene.textures.exists(TextureKeys.S1_Player)) {
            playerWidth = scene.textures.get(TextureKeys.S1_Player).getSourceImage().width * 0.6;
        }
        const leftTargetScale = Math.max(0.7, (playerWidth + 100) / boardBaseWidth);

        // 2. Check Right Content (Puzzle Items)
        let maxItemWidth = 0;
        itemsData.forEach(item => {
            if (scene.textures.exists(item.key)) {
                const w = scene.textures.get(item.key).getSourceImage().width;
                if (w > maxItemWidth) maxItemWidth = w;
            }
        });

        const targetItemScale = 0.45;
        const scaledMaxItemWidth = maxItemWidth * targetItemScale;
        const totalContentWidth = 50 + scaledMaxItemWidth + 30 + scaledMaxItemWidth + 50;
        const rightTargetScale = Math.max(0.7, totalContentWidth / boardBaseWidth);

        // 3. Take the maximum to ensure both sides fit
        return Math.max(leftTargetScale, rightTargetScale);
    }

    static createLeftPanel(scene: Phaser.Scene, bannerBg: Phaser.GameObjects.Image, targetScaleX: number, isGameActive: () => boolean) {
        const UI = GameConstants.SCENE1.UI;
        const boardY = bannerBg.y + bannerBg.displayHeight + GameUtils.pctY(scene, UI.BANNER_Y) + 30;
        const boardX = GameUtils.pctX(scene, 0.5) - GameUtils.pctX(scene, UI.BOARD_MARGIN_X);

        const { boardLeft, centerX } = this.createLeftBoard(scene, boardX, boardY, targetScaleX);

        const bubbleY = boardY + boardLeft.displayHeight * 0.12;
        this.createEllipse(scene, centerX, bubbleY);
        this.createPoem(scene, centerX, boardY, boardLeft.displayHeight, boardLeft.displayWidth, isGameActive);
        this.createRefImage(scene, centerX, boardY, boardLeft.displayHeight, isGameActive);
    }

    private static createLeftBoard(scene: Phaser.Scene, boardX: number, boardY: number, targetScaleX: number) {
        const boardLeft = scene.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(1, 0).setScale(targetScaleX -0.2, 0.7);

        return { boardLeft, centerX: boardX - (boardLeft.displayWidth / 2) };
    }

    private static createPoem(scene: Phaser.Scene, centerX: number, boardY: number, boardHeight: number, boardWidth: number, isGameActive: () => boolean) {
        const poemY = boardY + boardHeight * 0.38;
        const poemX = centerX - boardWidth * 0.01; // Dịch sang trái 10% chiều rộng bảng
        const poemText = scene.add.image(poemX, poemY, TextureKeys.S1_PoemText)
            .setScale(0.7).setInteractive({ useHandCursor: true });

        scene.tweens.add({ targets: poemText, y: '+=10', duration: GameConstants.SCENE1.ANIM.POEM_FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        poemText.on('pointerdown', () => {
            if (isGameActive()) {
                scene.events.emit('prompt-clicked');
                AudioManager.stopAll();
                AudioManager.play('cau_do');
                scene.tweens.add({ targets: poemText, scale: 0.6, duration: 100, yoyo: true, ease: 'Sine.easeInOut' });
            }
        });
    }

    private static createEllipse(scene: Phaser.Scene, centerX: number, bubbleY: number) {
        if (scene.textures.exists(TextureKeys.S1_Ellipse)) {
            const ellipse = scene.add.image(centerX, bubbleY + 20, TextureKeys.S1_Ellipse).setScale(0.7).setDepth(10);

            // Add rolling/rocking animation
            scene.tweens.add({
                targets: ellipse,
                x: '+=15',
                rotation: 0.15,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    //left board assets example
    private static createRefImage(scene: Phaser.Scene, centerX: number, boardY: number, boardHeight: number, isGameActive?: () => boolean) {
        const refImageY = boardY + boardHeight * 0.75;
        const refImage = scene.add.image(centerX, refImageY, TextureKeys.S1_Player)
            .setScale(0.6)
            .setInteractive({ useHandCursor: true });

        refImage.on('pointerdown', () => {
            if (isGameActive && isGameActive()) {
                scene.events.emit('prompt-clicked');
            }
        });
    }

    static createRightPanel(
        scene: Phaser.Scene,
        bannerBg: Phaser.GameObjects.Image,
        targetScaleX: number,
        itemsData: { key: string, isCorrect: boolean }[],
        onPuzzleItemClick: (item: Phaser.GameObjects.Image, isCorrect: boolean, index: number) => void
    ) {
        const UI = GameConstants.SCENE1.UI;
        const boardY = bannerBg.y + bannerBg.displayHeight + GameUtils.pctY(scene, UI.BANNER_Y) + 30;
        const boardX = GameUtils.pctX(scene, 0.5) + GameUtils.pctX(scene, UI.BOARD_MARGIN_X);

        const { boardRight, centerX, centerY, targetItemScale } = this.createRightBoard(scene, boardX, boardY, targetScaleX);

        const puzzleItems = this.createPuzzleItems(scene, centerX, centerY, boardRight, itemsData, targetItemScale, onPuzzleItemClick);
        const { victoryBg, victoryText } = this.createVictoryUI(scene, centerX, centerY);

        return { puzzleItems, victoryBg, victoryText };
    }

    private static createRightBoard(scene: Phaser.Scene, boardX: number, boardY: number, targetScaleX: number) {
        const targetItemScale = 0.65;

        const boardRight = scene.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(0, 0).setScale(targetScaleX-0.2, 0.7);

        return {
            boardRight,
            centerX: boardX + (boardRight.displayWidth / 2),
            centerY: boardY + boardRight.displayHeight / 2,
            targetItemScale
        };
    }

    private static createPuzzleItems(
        scene: Phaser.Scene,
        centerX: number, centerY: number,
        boardRight: Phaser.GameObjects.Image,
        itemsData: any[], targetItemScale: number,
        onClick: (item: Phaser.GameObjects.Image, isCorrect: boolean, index: number) => void
    ) {
        const finalItems = (itemsData && itemsData.length > 0) ? itemsData : [
            { key: 's1_item_crab', isCorrect: false },
            { key: 's1_item_fish', isCorrect: false },
            { key: 's1_item_shrimp', isCorrect: true }
        ];

        const puzzleItems: Phaser.GameObjects.Image[] = [];

        // Calculate spacing based on board size for responsiveness
        const spacingX = boardRight.displayWidth * 0.28;
        const spacingY = boardRight.displayHeight * 0.22;

        finalItems.forEach((item, index) => {
            let x = centerX, y = centerY;

            if (finalItems.length === 3) {
                // Layout: Triangle pointing Left (1 item left, 2 items right)
                // Center the whole group around centerX
                if (index === 1) {
                    // Left item
                    x = centerX - spacingX * 0.7;
                    y = centerY;
                } else if (index === 0) {
                    // Top Right item
                    x = centerX + spacingX * 0.8;
                    y = centerY - spacingY - 70;
                } else {
                    // Bottom Right item
                    x = centerX + spacingX * 0.8;
                    y = centerY + spacingY + 70;
                }
            } else if (finalItems.length === 2) {
                // Center 2 items horizontally
                const offset = boardRight.displayWidth * 0.18;
                x = centerX + (index === 0 ? -offset : offset);
            }

            const pItem = scene.add.image(x, y, item.key)
                .setInteractive({ useHandCursor: true })
                .setScale(targetItemScale);

            pItem.setData('key', item.key);
            pItem.setData('isCorrect', item.isCorrect);

            scene.tweens.add({
                targets: pItem,
                y: y - 10,
                duration: GameConstants.SCENE1.ANIM.FLOAT,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: index * 150 // Slight delay offset for natural feel
            });

            pItem.on('pointerdown', () => onClick(pItem, item.isCorrect, index));
            puzzleItems.push(pItem);
        });

        return puzzleItems;
    }

    private static createVictoryUI(scene: Phaser.Scene, centerX: number, centerY: number) {
        const victoryBg = scene.add.image(centerX, centerY, TextureKeys.BgPopup).setScale(0).setDepth(20);
        const victoryText = scene.add.image(centerX, centerY + 240, TextureKeys.S1_TextResult).setAlpha(0).setDepth(21).setScale(0.8);
        return { victoryBg, victoryText };
    }
}
