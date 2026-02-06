import Phaser from 'phaser';
import { GameConstants } from '../../consts/GameConstants';
import { GameUtils } from '../../utils/GameUtils';
import { TextureKeys } from '../../consts/Keys';
import { PaintManager } from '../../utils/PaintManager';

export class Scene2UI {
    static createUI(scene: Phaser.Scene) {
        const UI = GameConstants.SCENE2.UI;
        const cx = GameUtils.pctX(scene, 0.5);

        const bannerY = GameUtils.pctY(scene, UI.BANNER_Y);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bannerScale = (UI as any).BANNER_SCALE ?? 0.75;
        const banner = scene.add.image(cx, bannerY, TextureKeys.S2_Banner).setOrigin(0.5, 0).setScale(bannerScale);

        const textY = bannerY + banner.displayHeight / 2;
        scene.add.image(cx, textY, TextureKeys.S2_TextBanner).setScale(bannerScale);

        const boardY = banner.displayHeight + GameUtils.pctY(scene, UI.BOARD_OFFSET);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boardScale = (UI as any).BOARD_SCALE ?? 0.75;
        const boardRight = scene.add.image(cx, boardY, TextureKeys.S2_Rectangle1).setOrigin(0.5, 0).setScale(boardScale);

        // Character Octopus (Left) - Aligned with paintable octopus
        const ocX = cx - boardRight.displayWidth * 0.22;
        const ocY = boardY + boardRight.displayHeight * 0.42;
        scene.add.image(ocX, ocY, TextureKeys.S2_OcNew).setOrigin(0.5, 0.5).setScale(boardScale * 0.9);

        // Large Letter T (Right) - Aligned with paintable letter
        const tX = cx + boardRight.displayWidth * 0.25;
        const tY = boardY + boardRight.displayHeight * 0.42;
        scene.add.image(tX, tY, TextureKeys.S2_T).setOrigin(0.5, 0.5).setScale(boardScale * 0.9);

        // Text "con bạch tuộc" (Bottom Center)
        const txtX = cx;
        const txtY = boardY + boardRight.displayHeight * 0.7;
        scene.add.image(txtX, txtY, TextureKeys.S2_TextScene2).setOrigin(0.5, 0.5).setScale(boardScale * 0.9);

        const handHint = scene.add.image(0, 0, TextureKeys.HandHint).setDepth(200).setAlpha(0).setScale(0.7);

        return { handHint };
    }

    static createPalette(scene: Phaser.Scene, paintManager: PaintManager, paletteData: { key: string, color: number }[]) {
        const UI = GameConstants.SCENE2.UI;
        const spacing = GameUtils.pctX(scene, UI.PALETTE_SPACING);
        const yPos = GameUtils.pctY(scene, UI.PALETTE_Y);
        const totalItems = paletteData.length + 1;
        const startX = (GameUtils.getW(scene) - (totalItems - 1) * spacing) / 2;

        const paletteButtons: Phaser.GameObjects.Image[] = [];
        let firstColorBtn!: Phaser.GameObjects.Image;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const btnScale = (UI as any).PALETTE_BTN_SCALE ?? 0.65;

        paletteData.forEach((item, i) => {
            const btnX = startX + (i * spacing);
            const btn = scene.add.image(btnX, yPos, item.key).setInteractive();

            if (i === 0) {
                firstColorBtn = btn;
                btn.setScale(btnScale * 1.2).setAlpha(1);
            } else {
                btn.setAlpha(0.9).setScale(btnScale);
            }

            btn.on('pointerdown', () => {
                updatePaletteVisuals(paletteButtons, btn, btnScale);
                paintManager.setColor(item.color);
            });
            paletteButtons.push(btn);
        });

        const eraserX = startX + (paletteData.length * spacing);
        const eraser = scene.add.image(eraserX, yPos, TextureKeys.BtnEraser).setInteractive().setAlpha(0.9).setScale(btnScale);
        eraser.on('pointerdown', () => {
            updatePaletteVisuals(paletteButtons, eraser, btnScale);
            paintManager.setEraser();
        });
        paletteButtons.push(eraser);

        return { paletteButtons, firstColorBtn };
    }
}

function updatePaletteVisuals(buttons: Phaser.GameObjects.Image[], activeBtn: Phaser.GameObjects.Image, baseScale: number) {
    buttons.forEach(b => b.setScale(baseScale).setAlpha(0.9));
    activeBtn.setScale(baseScale * 1.2).setAlpha(1);
}
