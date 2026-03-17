import Phaser from 'phaser';
import { GameConstants } from '../consts/GameConstants';

export class PaintManager {
    private scene: Phaser.Scene;

    // Config
    private brushColor: number = GameConstants.PAINT.DEFAULT_COLOR;
    private brushSize: number = GameConstants.PAINT.BRUSH_SIZE;
    private brushTexture: string = 'brush_circle';

    // State
    private isErasing: boolean = false;
    private activePointers: Map<number, Phaser.GameObjects.RenderTexture> = new Map();

    // ✅ LOGIC MÀU: Map lưu danh sách màu đã dùng cho từng phần (Key: ID, Value: Set màu)
    private partColors: Map<string, Set<number>> = new Map();
    // ✅ FIX selected_color: Lưu màu cuối cùng thực sự được dùng (Set không re-insert, không đủ tin cậy)
    private lastUsedColor: Map<string, number> = new Map();

    // ✅ TỐI ƯU RAM: Tạo sẵn Canvas tạm để tái sử dụng, không new mới liên tục
    private helperCanvasPaint: HTMLCanvasElement;
    private helperCanvasMask: HTMLCanvasElement;
    private dilatedMaskKeys: string[] = [];

    // Callback trả về cả Set màu thay vì 1 màu lẻ
    private onPartComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void;
    // New callbacks for SDK integration
    private onPaintStart?: (id: string) => void;
    private onAttemptComplete?: (id: string, coverage: number, totalPx: number, matchPx: number, usedColors: Set<number>, spillPx: number) => void;

    constructor(
        scene: Phaser.Scene,
        onComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void,
        onStart?: (id: string) => void,
        onAttempt?: (id: string, coverage: number, totalPx: number, matchPx: number, usedColors: Set<number>, spillPx: number) => void
    ) {
        this.scene = scene;
        this.onPartComplete = onComplete;
        this.onPaintStart = onStart;
        this.onAttemptComplete = onAttempt;

        // Khởi tạo Canvas tạm 1 lần duy nhất
        this.helperCanvasPaint = document.createElement('canvas');
        this.helperCanvasMask = document.createElement('canvas');

        this.createBrushTexture();
    }

    private createBrushTexture() {
        if (!this.scene.textures.exists(this.brushTexture)) {
            const canvas = this.scene.textures.createCanvas(this.brushTexture, this.brushSize, this.brushSize);
            if (canvas) {
                const ctx = canvas.context;
                const grd = ctx.createRadialGradient(this.brushSize / 2, this.brushSize / 2, 0, this.brushSize / 2, this.brushSize / 2, this.brushSize / 2);
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

    public getCurrentColor(): number {
        return this.brushColor;
    }

    public setEraser() {
        this.isErasing = true;
    }

    public isPainting(): boolean {
        return this.activePointers.size > 0;
    }

    public createPaintableLayer(x: number, y: number, key: string, scale: number, uniqueId: string, scaleAdjust: number = 1, minCov?: number): Phaser.GameObjects.Image {
        const finalScale = scale * scaleAdjust;
        const rt = this.initRenderTexture(x, y, key, finalScale, uniqueId, minCov);
        return this.initHitArea(x, y, key, finalScale, uniqueId, rt);
    }

    /** Canvas-based morphological dilation: draws part at ±bleed offsets → solid alpha at edges */
    private createDilatedMaskKey(key: string, scale: number, bleed: number): { maskKey: string, w: number, h: number } {
        const src = this.scene.textures.get(key).getSourceImage() as HTMLImageElement;
        const dw = Math.ceil(src.width * scale), dh = Math.ceil(src.height * scale);
        const cw = dw + bleed * 2, ch = dh + bleed * 2;
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d')!;
        for (let dy = -bleed; dy <= bleed; dy++) {
            for (let dx = -bleed; dx <= bleed; dx++) {
                ctx.drawImage(src, bleed + dx, bleed + dy, dw, dh);
            }
        }
        const maskKey = `${key}_dmask`;
        if (!this.scene.textures.exists(maskKey)) this.scene.textures.addCanvas(maskKey, canvas);
        this.dilatedMaskKeys.push(maskKey);
        return { maskKey, w: cw, h: ch };
    }

    private initRenderTexture(x: number, y: number, key: string, scale: number, id: string, minCov?: number): Phaser.GameObjects.RenderTexture {
        // ① Dilated mask (1px bleed → solid alpha at edges, hidden under outline strokes)
        const BLEED_PX = 1;
        const { maskKey, w, h } = this.createDilatedMaskKey(key, scale, BLEED_PX);

        // ② Force RT dimensions to EVEN → integer center math
        const rtW = Math.ceil(w / 2) * 2;
        const rtH = Math.ceil(h / 2) * 2;

        // ③ Round center ONCE, derive topleft
        const cx = Math.round(x);
        const cy = Math.round(y);
        const rtX = cx - rtW / 2;
        const rtY = cy - rtH / 2;

        // Mask from dilated texture at scale 1 (already at display size)
        const maskImage = this.scene.make.image({ x: cx, y: cy, key: maskKey, add: false });
        const mask = maskImage.createBitmapMask();

        const rt = this.scene.add.renderTexture(rtX, rtY, rtW, rtH);

        rt.setOrigin(0, 0).setMask(mask).setDepth(10);
        rt.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        rt.setData('id', id);
        rt.setData('key', key);
        rt.setData('isFinished', false);
        if (minCov !== undefined) rt.setData('min_region_coverage', minCov);

        return rt;
    }

    private initHitArea(x: number, y: number, key: string, scale: number, id: string, rt: Phaser.GameObjects.RenderTexture): Phaser.GameObjects.Image {
        const hitArea = this.scene.add.image(x, y, key).setScale(scale).setAlpha(0.01).setDepth(50);
        hitArea.setInteractive({ useHandCursor: true, pixelPerfect: true });

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.handlePointerDownOnPart(pointer, rt, id);
        });

        return hitArea;
    }

    private handlePointerDownOnPart(pointer: Phaser.Input.Pointer, rt: Phaser.GameObjects.RenderTexture, id: string) {
        this.activePointers.set(pointer.id, rt);

        rt.setData('lastX', pointer.x - rt.x);
        rt.setData('lastY', pointer.y - rt.y);

        if (this.onPaintStart) this.onPaintStart(id);
        this.paint(pointer, rt, true);
    }

    public handlePointerMove(pointer: Phaser.Input.Pointer) {
        const rt = this.activePointers.get(pointer.id);
        if (pointer.isDown && rt) {
            this.paint(pointer, rt);
        }
    }

    public handlePointerUp(pointer: Phaser.Input.Pointer) {
        const rt = this.activePointers.get(pointer.id);
        if (rt) {
            this.checkProgress(rt);
            this.activePointers.delete(pointer.id);
        }
    }

    // ✅ HÀM PAINT MỚI: DÙNG LERP ĐỂ VẼ MƯỢT
    private paint(pointer: Phaser.Input.Pointer, rt: Phaser.GameObjects.RenderTexture, isFirstDot: boolean = false) {
        const currentX = pointer.x - rt.x;
        const currentY = pointer.y - rt.y;

        const lastX = rt.getData('lastX') ?? currentX;
        const lastY = rt.getData('lastY') ?? currentY;
        const distance = Phaser.Math.Distance.Between(lastX, lastY, currentX, currentY);

        if (distance < 1 && !isFirstDot) return;

        this.drawStroke(rt, lastX, lastY, currentX, currentY);
        this.drawFinalDot(rt, currentX, currentY);

        rt.setData('lastX', currentX);
        rt.setData('lastY', currentY);
    }

    private drawStroke(rt: Phaser.GameObjects.RenderTexture, x1: number, y1: number, x2: number, y2: number) {
        const stepSize = this.brushSize / 4;
        const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
        const steps = Math.ceil(distance / stepSize);
        const offset = this.brushSize / 2;

        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t;
            this.applyBrush(rt, px - offset, py - offset);
        }
    }

    private drawFinalDot(rt: Phaser.GameObjects.RenderTexture, x: number, y: number) {
        const offset = this.brushSize / 2;
        this.applyBrush(rt, x - offset, y - offset);

        if (!this.isErasing) {
            const id = rt.getData('id');
            if (!this.partColors.has(id)) this.partColors.set(id, new Set());
            this.partColors.get(id)!.add(this.brushColor);
            this.lastUsedColor.set(id, this.brushColor);
        }
    }

    private applyBrush(rt: Phaser.GameObjects.RenderTexture, x: number, y: number) {
        if (this.isErasing) {
            rt.erase(this.brushTexture, x, y);
        } else {
            rt.draw(this.brushTexture, x, y, 1.0, this.brushColor);
        }
    }

    // ✅ HÀM CHECK PROGRESS MỚI: TỐI ƯU BỘ NHỚ
    private checkProgress(rt: Phaser.GameObjects.RenderTexture) {
        rt.snapshot((snapshot) => {
            if (!(snapshot instanceof HTMLImageElement)) return;
            const stats = this.processSnapshot(rt, snapshot);
            if (!stats) return;

            this.reportAttempt(rt, stats);
            this.checkWinCondition(rt, stats.percentage);
        });
    }

    private processSnapshot(rt: Phaser.GameObjects.RenderTexture, snapshot: HTMLImageElement) {
        const source = this.scene.textures.get(rt.getData('key')).getSourceImage() as HTMLImageElement;
        const checkW = Math.floor(source.width / 4);
        const checkH = Math.floor(source.height / 4);
        if (checkW < 1 || checkH < 1) return null;

        // Paint canvas: crop bleed padding so only the original part region is compared
        const bleed = 1; // must match BLEED_PX in initRenderTexture
        const ctxP = this.getRecycledContext(this.helperCanvasPaint, snapshot, checkW, checkH,
            bleed, bleed, snapshot.width - bleed * 2, snapshot.height - bleed * 2);
        const ctxM = this.getRecycledContext(this.helperCanvasMask, source, checkW, checkH);

        if (!ctxP || !ctxM) return null;
        return this.countPixels(ctxP.getImageData(0, 0, checkW, checkH).data, ctxM.getImageData(0, 0, checkW, checkH).data);
    }

    private countPixels(paintData: Uint8ClampedArray, maskData: Uint8ClampedArray) {
        let match = 0, total = 0, spill = 0;
        for (let i = 3; i < paintData.length; i += 4) {
            const inMask = maskData[i] > 20;
            const isPainted = paintData[i] > 0;
            if (inMask) {
                total++;
                if (isPainted) match++;
            } else if (isPainted) spill++;
        }
        return { match, total, spill, percentage: total > 0 ? match / total : 0 };
    }

    private reportAttempt(rt: Phaser.GameObjects.RenderTexture, stats: any) {
        const id = rt.getData('id');
        const usedColors = this.partColors.get(id) || new Set([this.brushColor]);
        const trueLastColor = this.lastUsedColor.get(id) ?? this.brushColor;

        if (this.onAttemptComplete) {
            (this.onAttemptComplete as any)(id, stats.percentage, stats.total, stats.match, usedColors, stats.spill, trueLastColor);
        }
    }

    private checkWinCondition(rt: Phaser.GameObjects.RenderTexture, percentage: number) {
        const id = rt.getData('id');
        const threshold = rt.getData("min_region_coverage") ?? GameConstants.PAINT.WIN_PERCENT;

        if (!rt.getData('isFinished') && percentage >= threshold) {
            rt.setData('isFinished', true);
            const usedColors = this.partColors.get(id) || new Set([this.brushColor]);
            this.onPartComplete(id, rt, usedColors);
        }
    }

    /**
     * Pre-calculates the area (total pixels) of a mask for SDK 'expected' metadata.
     */
    public preCalculateArea(key: string): number {
        const sourceImg = this.scene.textures.get(key).getSourceImage() as HTMLImageElement;
        if (!sourceImg) return 0;

        const w = sourceImg.width;
        const h = sourceImg.height;
        const checkW = Math.floor(w / 4);
        const checkH = Math.floor(h / 4);

        const ctxMask = this.getRecycledContext(this.helperCanvasMask, sourceImg, checkW, checkH);
        if (!ctxMask) return 0;

        const maskData = ctxMask.getImageData(0, 0, checkW, checkH).data;
        let total = 0;
        for (let i = 3; i < maskData.length; i += 4) {
            if (maskData[i] > 20) total++;
        }
        return total;
    }

    private getRecycledContext(canvas: HTMLCanvasElement, img: HTMLImageElement, w: number, h: number,
        sx?: number, sy?: number, sw?: number, sh?: number) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, w, h);
            if (sx !== undefined && sy !== undefined && sw !== undefined && sh !== undefined) {
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
            } else {
                ctx.drawImage(img, 0, 0, w, h);
            }
        }
        return ctx;
    }

    public destroy() {
        this.partColors.clear();
        this.lastUsedColor.clear();
        this.helperCanvasPaint.remove();
        this.helperCanvasMask.remove();
        this.activePointers.clear();
        this.dilatedMaskKeys.forEach(k => { if (this.scene.textures.exists(k)) this.scene.textures.remove(k); });
        this.dilatedMaskKeys = [];
    }
}