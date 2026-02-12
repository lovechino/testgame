import Phaser from 'phaser';
import { GameConstants } from '../../../consts/GameConstants';
import { TextureKeys } from '../../../consts/Keys';
import { GameUtils } from '../../../utils/GameUtils';
import { PaintManager } from '../../../utils/PaintManager';

export class Scene2UI {
    private scene: Phaser.Scene;
    private paintManager: PaintManager;

    private paletteButtons: Phaser.GameObjects.Image[] = [];
    private firstColorBtn!: Phaser.GameObjects.Image;

    private readonly PALETTE_DATA = [
        { key: TextureKeys.BtnRed, color: 0xFF595E },
        { key: TextureKeys.BtnYellow, color: 0xFFCA3A },
        { key: TextureKeys.BtnGreen, color: 0x8AC926 },
        { key: TextureKeys.BtnBlue, color: 0x1982C4 },
        { key: TextureKeys.BtnPurple, color: 0x6A4C93 },
        { key: TextureKeys.BtnCream, color: 0xFDFCDC },
        { key: TextureKeys.BtnBlack, color: 0x000000 }
    ];

    constructor(scene: Phaser.Scene, paintManager: PaintManager) {
        this.scene = scene;
        this.paintManager = paintManager;
    }

    public init() {
        this.paletteButtons = [];
    }

    public createUI() {
        const UI = GameConstants.SCENE2.UI;
        const cx = GameUtils.pctX(this.scene, 0.5);

        const bannerY = GameUtils.pctY(this.scene, UI.BANNER_Y);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bannerScale = (UI as any).BANNER_SCALE ?? 0.75;
        const banner = this.scene.add.image(cx, bannerY, TextureKeys.S2_Banner).setOrigin(0.5, 0).setScale(bannerScale);

        const textY = bannerY + banner.displayHeight / 2;
        this.scene.add.image(cx, textY, TextureKeys.S2_TextBanner).setScale(bannerScale);

        const boardY = banner.displayHeight + GameUtils.pctY(this.scene, UI.BOARD_OFFSET);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boardScale = (UI as any).BOARD_SCALE ?? 0.75;
        this.scene.add.image(cx, boardY, TextureKeys.S2_rectangle).setOrigin(0.5, 0.1).setScale(boardScale);

        const ballX = GameUtils.getW(this.scene) * 0.55;
        const ballY = boardY + GameUtils.pctY(this.scene, 0.05);
        this.scene.add.image(ballX, ballY, TextureKeys.S2_ball).setOrigin(0, 0).setScale(boardScale);

        const textsX = GameUtils.getW(this.scene) * 0.4;
        const textsY = boardY + GameUtils.pctY(this.scene, 0.55);
        this.scene.add.image(textsX, textsY, TextureKeys.S2_text_scene2).setOrigin(0, 0).setScale(boardScale);

        this.createPalette();
    }

    private createPalette() {
        const UI = GameConstants.SCENE2.UI;
        const spacing = GameUtils.pctX(this.scene, UI.PALETTE_SPACING);
        const yPos = GameUtils.pctY(this.scene, UI.PALETTE_Y);
        const totalItems = this.PALETTE_DATA.length + 1;
        const startX = (GameUtils.getW(this.scene) - (totalItems - 1) * spacing) / 2;

        this.PALETTE_DATA.forEach((item, i) => {
            const btnX = startX + (i * spacing);
            const btn = this.scene.add.image(btnX, yPos, item.key).setInteractive();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const btnScale = (UI as any).PALETTE_BTN_SCALE ?? 0.65;
            if (i === 0) {
                this.firstColorBtn = btn;
                btn.setScale(btnScale * 1.2).setAlpha(1);
            } else {
                btn.setAlpha(0.9).setScale(btnScale);
            }

            btn.on('pointerdown', () => {
                this.updatePaletteVisuals(btn);
                this.paintManager.setColor(item.color);
            });
            this.paletteButtons.push(btn);
        });

        const eraserX = startX + (this.PALETTE_DATA.length * spacing);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const btnScale = (UI as any).PALETTE_BTN_SCALE ?? 0.65;
        const eraser = this.scene.add.image(eraserX, yPos, TextureKeys.BtnEraser).setInteractive().setAlpha(0.9).setScale(btnScale);
        eraser.on('pointerdown', () => {
            this.updatePaletteVisuals(eraser);
            this.paintManager.setEraser();
        });
        this.paletteButtons.push(eraser);

        // Init default color
        this.paintManager.setColor(this.PALETTE_DATA[0].color);
    }

    private updatePaletteVisuals(activeBtn: Phaser.GameObjects.Image) {
        const UI = GameConstants.SCENE2.UI;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const btnScale = (UI as any).PALETTE_BTN_SCALE ?? 0.65;
        this.paletteButtons.forEach(b => b.setScale(btnScale).setAlpha(0.9));
        activeBtn.setScale(btnScale * 1.2).setAlpha(1);
    }

    public getFirstColorBtn(): Phaser.GameObjects.Image {
        return this.firstColorBtn;
    }
}
