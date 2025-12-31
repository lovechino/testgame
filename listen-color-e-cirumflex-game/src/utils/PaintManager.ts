import Phaser from 'phaser';
import { GameConstants } from '../consts/GameConstants';

export class PaintManager {
    private scene: Phaser.Scene;
    private brushColor: number = GameConstants.PAINT.DEFAULT_COLOR;
    private brushSize: number = GameConstants.PAINT.BRUSH_SIZE;
    private brushTexture: string = 'brush_circle';
    
    private isErasing: boolean = false;
    private activeRenderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private lastX: number = 0;
    private lastY: number = 0;
    private partColors: Map<string, Set<number>> = new Map();

    // Biến tái sử dụng (Object Pooling)
    private helperCanvasPaint: HTMLCanvasElement;
    private helperCanvasMask: HTMLCanvasElement;

    private onPartComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void;

    // --- CẤU HÌNH TỐI ƯU ---
    private readonly DOWNSAMPLE_RATIO = 6;  // Chia nhỏ ảnh 6 lần để check
    private readonly INTERPOLATION_STEP = 2.5; // Vẽ thưa hơn chút để nhẹ máy

    constructor(scene: Phaser.Scene, onComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void) {
        this.scene = scene;
        this.onPartComplete = onComplete;
        
        // Tạo Canvas 1 lần duy nhất
        this.helperCanvasPaint = document.createElement('canvas');
        this.helperCanvasMask = document.createElement('canvas');
        
        this.createBrushTexture();
    }

    private createBrushTexture() {
        if (!this.scene.textures.exists(this.brushTexture)) {
            const canvas = this.scene.textures.createCanvas(this.brushTexture, this.brushSize, this.brushSize);
            if (canvas) {
                const ctx = canvas.context;
                // Dùng cọ cứng (Hard Brush) tối ưu cho GPU
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(this.brushSize/2, this.brushSize/2, this.brushSize/2, 0, Math.PI * 2);
                ctx.fill();
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
            this.lastX = pointer.x - rt.x;
            this.lastY = pointer.y - rt.y;
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
        const currentX = pointer.x - rt.x;
        const currentY = pointer.y - rt.y;
        const distance = Phaser.Math.Distance.Between(this.lastX, this.lastY, currentX, currentY);

        // Tối ưu: Bỏ qua rung tay nhỏ (< 5px)
        if (distance < 5) return;

        const stepSize = this.brushSize / this.INTERPOLATION_STEP; 
        
        if (distance > stepSize) {
            const steps = Math.ceil(distance / stepSize);
            const offset = this.brushSize / 2;
            for (let i = 0; i < steps; i++) {
                const t = i / steps;
                const interpX = this.lastX + (currentX - this.lastX) * t;
                const interpY = this.lastY + (currentY - this.lastY) * t;
                this.drawDot(rt, interpX - offset, interpY - offset);
            }
        }

        const offset = this.brushSize / 2;
        this.drawDot(rt, currentX - offset, currentY - offset);

        if (!this.isErasing) {
            const id = rt.getData('id');
            if (!this.partColors.has(id)) this.partColors.set(id, new Set());
            this.partColors.get(id)?.add(this.brushColor);
        }

        this.lastX = currentX;
        this.lastY = currentY;
    }

    private drawDot(rt: Phaser.GameObjects.RenderTexture, x: number, y: number) {
        if (this.isErasing) {
            rt.erase(this.brushTexture, x, y);
        } else {
            rt.draw(this.brushTexture, x, y, 1.0, this.brushColor);
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
            // Tối ưu: Giảm kích thước ảnh để check nhanh
            const checkW = Math.floor(w / this.DOWNSAMPLE_RATIO);
            const checkH = Math.floor(h / this.DOWNSAMPLE_RATIO);

            const ctxPaint = this.getRecycledContext(this.helperCanvasPaint, snapshot, checkW, checkH);
            const sourceImg = this.scene.textures.get(key).getSourceImage() as HTMLImageElement;
            const ctxMask = this.getRecycledContext(this.helperCanvasMask, sourceImg, checkW, checkH);

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
            
            if (percentage > GameConstants.PAINT.WIN_PERCENT) {
                rt.setData('isFinished', true);
                const usedColors = this.partColors.get(id) || new Set([this.brushColor]);
                this.onPartComplete(id, rt, usedColors);
                this.partColors.delete(id);
            }
        });
    }

    private getRecycledContext(canvas: HTMLCanvasElement, img: HTMLImageElement, w: number, h: number) {
        canvas.width = w; 
        canvas.height = h;
        // willReadFrequently: true là cờ tối ưu cho trình duyệt
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
        if (ctx) {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
        }
        return ctx;
    }
}