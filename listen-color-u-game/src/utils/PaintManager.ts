import Phaser from 'phaser';
import { GameConstants } from '../consts/GameConstants';
import { BrushTool } from './paint/BrushTool';
import { ProgressChecker } from './paint/ProgressChecker';

export class PaintManager {
    private scene: Phaser.Scene;

    // Components
    private brushTool: BrushTool;
    private progressChecker: ProgressChecker;

    // State
    private activeRenderTexture: Phaser.GameObjects.RenderTexture | null = null;

    // Callback
    private onPartComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void;

    constructor(scene: Phaser.Scene, onComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void) {
        this.scene = scene;
        this.onPartComplete = onComplete;

        this.brushTool = new BrushTool(scene);
        this.progressChecker = new ProgressChecker(scene);
    }

    public setColor(color: number) {
        this.brushTool.setColor(color);
    }

    public setEraser() {
        this.brushTool.setEraser();
    }

    public isPainting(): boolean {
        return this.activeRenderTexture !== null;
    }

    public createPaintableLayer(x: number, y: number, key: string, scale: number, uniqueId: string): Phaser.GameObjects.Image {
        const maskImage = this.scene.make.image({ x, y, key, add: false }).setScale(scale);
        const mask = maskImage.createBitmapMask();

        const rtW = maskImage.width * scale;
        const rtH = maskImage.height * scale;
        const rt = this.scene.add.renderTexture(x - rtW / 2, y - rtH / 2, rtW, rtH);

        rt.setOrigin(0, 0).setMask(mask).setDepth(10);
        rt.setData('id', uniqueId);
        rt.setData('key', key);
        rt.setData('isFinished', false);

        const hitArea = this.scene.add.image(x, y, key).setScale(scale).setAlpha(0.01).setDepth(50);
        hitArea.setInteractive({ useHandCursor: true, pixelPerfect: true });

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.activeRenderTexture = rt;
            this.brushTool.startStroke(pointer.x - rt.x, pointer.y - rt.y);
            this.brushTool.paint(pointer, rt);
        });

        return hitArea;
    }

    public handlePointerMove(pointer: Phaser.Input.Pointer) {
        if (pointer.isDown && this.activeRenderTexture) {
            this.brushTool.paint(pointer, this.activeRenderTexture);
        }
    }

    public handlePointerUp() {
        if (this.activeRenderTexture) {
            // Check progress before clearing active texture
            const rt = this.activeRenderTexture;

            // Only check progress if not erasing (optional optimization, but good for UX)
            this.progressChecker.checkProgress(rt, (percentage) => {
                rt.setData('isFinished', true);

                // Get colors from BrushTool
                const id = rt.getData('id');
                const usedColors = this.brushTool.getUsedColors(id);

                this.onPartComplete(id, rt, usedColors);

                // Clean up color memory for this part
                this.brushTool.clearUsedColors(id);
            });

            this.activeRenderTexture = null;
        }
    }
}