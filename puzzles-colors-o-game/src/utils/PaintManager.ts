import Phaser from 'phaser';
import { GameConstants } from '../consts/GameConstants'; // Import mới

export class PaintManager {
    private scene: Phaser.Scene;
    
    // Sử dụng Constant thay vì số cứng
    private brushColor: number = GameConstants.PAINT.DEFAULT_COLOR;
    private brushSize: number = GameConstants.PAINT.BRUSH_SIZE;
    
    private brushTexture: string = 'brush_circle';
    private isErasing: boolean = false;
    private activeRenderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private onPartComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, colorUsed: number) => void;

    constructor(scene: Phaser.Scene, onComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, colorUsed: number) => void) {
        this.scene = scene;
        this.onPartComplete = onComplete;
        this.createBrushTexture();
    }

    private createBrushTexture() {
        if (!this.scene.textures.exists(this.brushTexture)) {
            const canvas = this.scene.textures.createCanvas(this.brushTexture, this.brushSize, this.brushSize);
            if (canvas) {
                const ctx = canvas.context;
                const grd = ctx.createRadialGradient(this.brushSize/2, this.brushSize/2, 0, this.brushSize/2, this.brushSize/2, this.brushSize/2);
                grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, this.brushSize, this.brushSize);
                canvas.refresh();
            }
        }
    }

    public setColor(color: number) {
        this.isErasing = false;
        this.brushColor = color;
    }

    public setEraser() {
        this.isErasing = true;
    }

    public isPainting(): boolean {
        return this.activeRenderTexture !== null;
    }

    public createPaintableLayer(x: number, y: number, key: string, scale: number, uniqueId: string): Phaser.GameObjects.Image {
        const maskImage = this.scene.make.image({ x, y, key, add: false }).setScale(scale);
        const mask = maskImage.createBitmapMask();

        const rtW = maskImage.width * scale;
        const rtH = maskImage.height * scale;
        const rt = this.scene.add.renderTexture(x - rtW/2, y - rtH/2, rtW, rtH);
        
        rt.setOrigin(0, 0).setMask(mask).setDepth(10);
        rt.setData('id', uniqueId);
        rt.setData('key', key); 
        rt.setData('isFinished', false);

        const hitArea = this.scene.add.image(x, y, key).setScale(scale).setAlpha(0.01).setDepth(50);
        hitArea.setInteractive({ useHandCursor: true, pixelPerfect: true });

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.activeRenderTexture = rt;
            this.paint(pointer, rt);
        });

        return hitArea;
    }

    public handlePointerMove(pointer: Phaser.Input.Pointer) {
        if (pointer.isDown && this.activeRenderTexture) {
            this.paint(pointer, this.activeRenderTexture);
        }
    }

    public handlePointerUp() {
        if (this.isErasing) {
            this.activeRenderTexture = null;
            return;
        }
        if (this.activeRenderTexture) {
            this.checkProgress(this.activeRenderTexture);
            this.activeRenderTexture = null;
        }
    }

    private paint(pointer: Phaser.Input.Pointer, rt: Phaser.GameObjects.RenderTexture) {
        const localX = pointer.x - rt.x;
        const localY = pointer.y - rt.y;
        const offset = this.brushSize / 2;

        if (this.isErasing) {
            rt.erase(this.brushTexture, localX - offset, localY - offset);
        } else {
            rt.draw(this.brushTexture, localX - offset, localY - offset, 1.0, this.brushColor);
        }
    }

    private checkProgress(rt: Phaser.GameObjects.RenderTexture) {
        if (rt.getData('isFinished')) return;
        
        const id = rt.getData('id');
        const key = rt.getData('key');

        rt.snapshot((snapshot) => {
            if (!(snapshot instanceof HTMLImageElement)) return;
            
            const w = snapshot.width;
            const h = snapshot.height;
            const checkW = Math.floor(w / 4);
            const checkH = Math.floor(h / 4);

            const ctxPaint = this.getTempContext(snapshot, checkW, checkH);
            const ctxMask = this.getTempContext(this.scene.textures.get(key).getSourceImage() as HTMLImageElement, checkW, checkH);

            if (!ctxPaint || !ctxMask) return;

            const paintData = ctxPaint.getImageData(0, 0, checkW, checkH).data;
            const maskData = ctxMask.getImageData(0, 0, checkW, checkH).data;

            let match = 0;
            let total = 0;

            for (let i = 3; i < paintData.length; i += 4) {
                if (maskData[i] > 0) {
                    total++;
                    if (paintData[i] > 0) match++;
                }
            }

            const percentage = total > 0 ? match / total : 0;
            
            // Sử dụng Constant tỷ lệ thắng
            if (percentage > GameConstants.PAINT.WIN_PERCENT) {
                rt.setData('isFinished', true);
                this.onPartComplete(id, rt, this.brushColor);
            }
        });
    }

    private getTempContext(img: HTMLImageElement, w: number, h: number) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, w, h);
        return ctx;
    }
}