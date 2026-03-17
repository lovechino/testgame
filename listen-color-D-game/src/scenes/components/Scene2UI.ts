import Phaser from 'phaser';
import { GameConstants } from '../../consts/GameConstants';
import { GameUtils } from '../../utils/GameUtils';
import { TextureKeys } from '../../consts/Keys';
import { PaintManager } from '../../utils/PaintManager';

export class Scene2UI {
    static createCompleteUI(scene: Phaser.Scene, paintManager: PaintManager, paletteData: { key: string, color: number }[], onFirstColorTap?: () => void) {
        const layout = this.createLayout(scene);
        const { paletteButtons, firstColorBtn } = this.createPalette(scene, paintManager, paletteData, layout.paletteY, onFirstColorTap);

        return {
            handHint: layout.handHint,
            autoScales: layout.autoScales,
            outlines: layout.outlines,
            paletteButtons,
            firstColorBtn
        };
    }

    private static createLayout(scene: Phaser.Scene) {
        const UI = GameConstants.SCENE2.UI;
        const cx = GameUtils.pctX(scene, 0.5);
        const bannerY = GameUtils.pctY(scene, UI.BANNER_Y);

        // Banner
        const banner = scene.add.image(cx, bannerY, TextureKeys.S2_Banner).setOrigin(0.5, 0);

        // Banner Scaling Logic
        const maxBannerWidth = scene.scale.width * 0.9;
        if (banner.width > maxBannerWidth) {
            banner.setDisplaySize(maxBannerWidth, banner.height * (maxBannerWidth / banner.width));
        } else {
            banner.setScale(0.9);
        }

        // --- DYNAMIC BOARD SIZING ---
        const gapTop = GameUtils.pctY(scene, UI.BANNER_Y);
        const gapBottom = GameUtils.pctY(scene, 0.05);

        const bannerBottom = banner.y + banner.displayHeight;
        const availableHeight = scene.scale.height - bannerBottom - gapTop - gapBottom;

        // Load Board Texture dimensions
        let boardBaseWidth = 800;
        let boardBaseHeight = 600;
        if (scene.textures.exists(TextureKeys.S2_Board)) {
            const img = scene.textures.get(TextureKeys.S2_Board).getSourceImage();
            boardBaseWidth = img.width;
            boardBaseHeight = img.height;
        }

        // Calculate Scale to fit Available Height
        const maxBoardWidth = scene.scale.width * 0.95;

        const scaleY = availableHeight / boardBaseHeight;
        const scaleX = maxBoardWidth / boardBaseWidth;

        const actualScaleX = scaleX;
        const actualScaleY = scaleY;

        // Center the board in the available space
        const boardY = bannerBottom + gapTop + (availableHeight / 2);

        scene.add.image(cx, boardY, TextureKeys.S2_Board)
            .setOrigin(0.5, 0.5)
            .setScale(actualScaleX, actualScaleY);

        if (scene.textures.exists('common_board')) {
            scene.add.image(cx, boardY, 'common_board')
                .setOrigin(0.5, 0.5)
                .setScale(actualScaleX, actualScaleY);
        }

        // Banner Frame Wrapper
        if (scene.textures.exists(TextureKeys.BannerFrame)) {
            const frameWrapper = scene.add.image(cx, bannerY, TextureKeys.BannerFrame).setOrigin(0.5, 0).setDepth(banner.depth - 1);
            const framePaddingX = 200;
            const framePaddingY = 60;
            frameWrapper.setOrigin(0.5, 0.5);
            const bannerCenterY = bannerY + (banner.displayHeight / 2);
            frameWrapper.setPosition(cx, bannerCenterY);
            frameWrapper.setDisplaySize(banner.displayWidth + framePaddingX, banner.displayHeight + framePaddingY);
        }

        // Optional Text Banner
        if (scene.textures.exists(TextureKeys.S2_TextBanner)) {
            const textY = bannerY + banner.displayHeight / 2;
            scene.add.image(cx, textY, TextureKeys.S2_TextBanner).setScale(0.7);
        }

        // --- PALETTE & OUTLINE LAYOUT ---
        const boardHeight = boardBaseHeight * actualScaleY;
        const boardWidth = boardBaseWidth * actualScaleX;
        const boardTop = boardY - (boardHeight / 2);

        const paletteY = boardTop + (boardHeight * 0.9);

        // --- OUTLINES (Visual Guides) ---
        const outlinesAvailableHeight = (paletteY - boardTop) * 0.82;
        const outlinesAvailableWidth = boardWidth * 0.9;

        const outlineCenterY = boardTop + (outlinesAvailableHeight / 2) + (boardHeight * 0.05);

        const outline1X = cx - (outlinesAvailableWidth * 0.25);
        const outline2X = cx + (outlinesAvailableWidth * 0.25);

        const safeZoneW = outlinesAvailableWidth / 2 * 0.85;
        const safeZoneH = outlinesAvailableHeight * 0.9;

        const scale1 = GameUtils.getScaleToFit(scene, 's2_outline_1', safeZoneW / scene.scale.width, safeZoneH / scene.scale.height);
        const scale2 = GameUtils.getScaleToFit(scene, 's2_outline_2', safeZoneW / scene.scale.width, safeZoneH / scene.scale.height);

        if (scene.textures.exists('s2_outline_1')) {
            const gk = scene.add.image(outline1X, outlineCenterY, 's2_outline_1').setScale(scale1).setDepth(20);

            // Add ball near goalkeeper's hand (relative to gk position)
            if (scene.textures.exists(TextureKeys.S2_Ball)) {
                // GK is centered, hand is roughly at top right area
                const ballX = outline1X + gk.displayWidth * 0.58;
                const ballY = outlineCenterY - gk.displayHeight * 0.45;
                scene.add.image(ballX, ballY, TextureKeys.S2_Ball).setScale(scale1 * 0.8).setDepth(21);
            }
        }
        if (scene.textures.exists('s2_outline_2')) {
            scene.add.image(outline2X, outlineCenterY, 's2_outline_2').setScale(scale2).setDepth(20);
        }

        // text_footer
        if (scene.textures.exists(TextureKeys.S2_TextScene2)) {
            const txtY = paletteY - GameUtils.pctY(scene, 0.08);
            scene.add.image(cx, txtY, TextureKeys.S2_TextScene2)
                .setOrigin(0.5, 1)
                .setScale(actualScaleY * 1.1);
        }

        const handHint = scene.add.image(0, 0, TextureKeys.HandHint).setAlpha(0).setDepth(100).setScale(0.8);

        return {
            handHint,
            boardCenterX: cx,
            boardCenterY: boardY,
            boardScale: actualScaleY,
            autoScales: { group1: scale1, group2: scale2 },
            paletteY,
            outlines: {
                group1: { x: outline1X, y: outlineCenterY },
                group2: { x: outline2X, y: outlineCenterY }
            }
        };
    }

    private static createPalette(scene: Phaser.Scene, paintManager: PaintManager, paletteData: { key: string, color: number }[], paletteY: number, onFirstColorTap?: () => void) {
        const UI = GameConstants.SCENE2.UI;
        const startX = GameUtils.pctX(scene, 0.5) - (paletteData.length - 1) * GameUtils.pctX(scene, UI.PALETTE_SPACING) / 2;

        const y = paletteY;
        const paletteButtons: Phaser.GameObjects.Image[] = [];
        let firstTapDone = false;

        paletteData.forEach((p, i) => {
            const btn = scene.add.image(startX + i * GameUtils.pctX(scene, UI.PALETTE_SPACING), y, p.key)
                .setInteractive({ useHandCursor: true })
                .setScale(0.8);

            btn.on('pointerdown', () => {
                // Gọi callback lần đầu bé chạm vào màu
                if (!firstTapDone && onFirstColorTap) {
                    firstTapDone = true;
                    onFirstColorTap();
                }
                paletteButtons.forEach(b => b.setScale(0.8).clearTint());
                btn.setScale(1.0);
                paintManager.setColor(p.color);
            });

            if (i === 0) {
                btn.setScale(1.0);
                paintManager.setColor(p.color);
            }

            paletteButtons.push(btn);
        });
        // btn_eraser
        if (scene.textures.exists(TextureKeys.BtnEraser)) {
            const eraserX = startX + paletteData.length * GameUtils.pctX(scene, UI.PALETTE_SPACING) + 30;
            const eraserBtn = scene.add.image(eraserX, y, TextureKeys.BtnEraser)
                .setInteractive({ useHandCursor: true })
                .setScale(0.8);

            eraserBtn.on('pointerdown', () => {
                paletteButtons.forEach(b => b.setScale(0.8).clearTint());
                eraserBtn.setScale(1.0);
                paintManager.setEraser();
            });

            paletteButtons.push(eraserBtn);
        }

        return { paletteButtons, firstColorBtn: paletteButtons[0] };
    }
}
