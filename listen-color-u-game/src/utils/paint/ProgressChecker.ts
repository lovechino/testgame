import Phaser from 'phaser';
import { GameConstants } from '../../consts/GameConstants';

export class ProgressChecker {
    private scene: Phaser.Scene;

    // RAM Optimization: Reusable Canvases
    private helperCanvasPaint: HTMLCanvasElement;
    private helperCanvasMask: HTMLCanvasElement;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.helperCanvasPaint = document.createElement('canvas');
        this.helperCanvasMask = document.createElement('canvas');
    }

    public checkProgress(rt: Phaser.GameObjects.RenderTexture, onComplete: (percentage: number) => void) {
        if (rt.getData('isFinished')) return;

        const key = rt.getData('key');

        rt.snapshot((snapshot) => {
            if (!(snapshot instanceof HTMLImageElement)) return;

            const w = snapshot.width;
            const h = snapshot.height;
            const checkW = Math.floor(w / 4);
            const checkH = Math.floor(h / 4);

            // Reuse Contexts
            const ctxPaint = this.getRecycledContext(this.helperCanvasPaint, snapshot, checkW, checkH);
            const sourceImg = this.scene.textures.get(key).getSourceImage() as HTMLImageElement;
            const ctxMask = this.getRecycledContext(this.helperCanvasMask, sourceImg, checkW, checkH);

            if (!ctxPaint || !ctxMask) return;

            const paintData = ctxPaint.getImageData(0, 0, checkW, checkH).data;
            const maskData = ctxMask.getImageData(0, 0, checkW, checkH).data;

            let match = 0;
            let total = 0;

            // Pixel counting algorithm
            for (let i = 3; i < paintData.length; i += 4) {
                if (maskData[i] > 0) { // If pixel is in mask
                    total++;
                    if (paintData[i] > 0) match++; // If painted
                }
            }

            const percentage = total > 0 ? match / total : 0;

            if (percentage > GameConstants.PAINT.WIN_PERCENT) {
                onComplete(percentage);
            }
        });
    }

    // Helper to reuse Context
    private getRecycledContext(canvas: HTMLCanvasElement, img: HTMLImageElement, w: number, h: number) {
        canvas.width = w; // Setting width auto-clears
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            ctx.clearRect(0, 0, w, h); // Explicit clear
            ctx.drawImage(img, 0, 0, w, h);
        }
        return ctx;
    }
}
