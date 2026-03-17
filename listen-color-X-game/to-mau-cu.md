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
    private activeRenderTexture: Phaser.GameObjects.RenderTexture | null = null;

    // ✅ FIX LAG: Biến lưu vị trí cũ để vẽ LERP
    private lastX: number = 0;
    private lastY: number = 0;

    // ✅ LOGIC MÀU: Map lưu danh sách màu đã dùng cho từng phần (Key: ID, Value: Set màu)
    private partColors: Map<string, Set<number>> = new Map();

    // ✅ LOGIC MÀU PER-STROKE: Map lưu màu đã dùng trong stroke hiện tại (reset mỗi pointerup)
    private strokeColors: Map<string, Set<number>> = new Map();

    // ✅ TỐI ƯU RAM: Tạo sẵn Canvas tạm để tái sử dụng, không new mới liên tục
    private helperCanvasPaint: HTMLCanvasElement;
    private helperCanvasMask: HTMLCanvasElement;

    // Callback trả về cả Set màu thay vì 1 màu lẻ
    private onPartComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>, matchPx: number, totalPx: number, strokeUsedColors: Set<number>) => void;

    // Callback khi bé tô thêm vào part ĐÃ hoàn thành
    private onPostCompletionStroke: (id: string, strokeUsedColors: Set<number>, usedColors: Set<number>, matchPx: number) => void;

    // Callback khi bé tẩy khiến part đã hoàn thành rớt xuống dưới ngưỡng → cần tô lại
    private onPartUncomplete: (id: string, rt: Phaser.GameObjects.RenderTexture) => void;

    constructor(
        scene: Phaser.Scene,
        onComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>, matchPx: number, totalPx: number, strokeUsedColors: Set<number>) => void,
        onPostStroke: (id: string, strokeUsedColors: Set<number>, usedColors: Set<number>, matchPx: number) => void,
        onUncomplete?: (id: string, rt: Phaser.GameObjects.RenderTexture) => void
    ) {
        this.scene = scene;
        this.onPartComplete = onComplete;
        this.onPostCompletionStroke = onPostStroke;
        this.onPartUncomplete = onUncomplete ?? (() => { });

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
        const rt = this.scene.add.renderTexture(x - rtW / 2, y - rtH / 2, rtW, rtH);

        rt.setOrigin(0, 0).setMask(mask).setDepth(10);
        rt.setData('id', uniqueId);
        rt.setData('key', key);
        rt.setData('isFinished', false);
        rt.setData('partScale', scale); // Lưu scale để checkProgress dùng cùng formula với computeAreaPx

        // ✅ TÍNH area_px 1 LẦN DUY NHẤT và lưu trên RT
        // checkProgress & recheckAfterErase sẽ dùng giá trị này thay vì đếm lại
        // → Đảm bảo total luôn nhất quán, không bị lệch do canvas sampling
        const areaPx = this.computeAreaPx(key, scale);
        rt.setData('area_px', areaPx);

        // RT chỉ chứa stroke hiện tại (khi part đã hoàn thành) — dùng để đếm px attempt 2 không cộng dồn
        const maskImageStroke = this.scene.make.image({ x, y, key, add: false }).setScale(scale);
        const maskStroke = maskImageStroke.createBitmapMask();
        const strokeRT = this.scene.add.renderTexture(x - rtW / 2, y - rtH / 2, rtW, rtH);
        strokeRT.setOrigin(0, 0).setMask(maskStroke).setDepth(-1).setVisible(false);
        rt.setData('strokeRT', strokeRT);

        const hitArea = this.scene.add.image(x, y, key).setScale(scale).setAlpha(0.01).setDepth(50);
        // Lưu area_px lên hitArea để Scene2 dùng cho SDK tracker
        hitArea.setData('area_px', areaPx);

        // DEBUG: Hiện màu body để thấy vị trí từng part
        //hitArea.setAlpha(0.4).setTint(0xff0000 + 0.5 * 0xffff | 0);

        hitArea.setInteractive({ useHandCursor: true, pixelPerfect: true });

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.activeRenderTexture = rt;

            // Attempt 2 (part đã hoàn thành): clear stroke RT để chỉ đếm px của stroke này
            if (rt.getData('isFinished')) {
                const strokeRT = rt.getData('strokeRT') as Phaser.GameObjects.RenderTexture | undefined;
                if (strokeRT) strokeRT.clear();
            }

            // ✅ QUAN TRỌNG: Lưu vị trí bắt đầu để tính toán LERP
            this.lastX = pointer.x - rt.x;
            this.lastY = pointer.y - rt.y;

            this.paint(pointer, rt);

            // Mỗi lần chạm tay = bắt đầu 1 attempt mới trong SDK history
            // KHÔNG gọi khi đang dùng tẩy — tẩy không phải attempt tô màu
            if (!this.isErasing) {
                const scene = this.scene as any;
                if (scene.handleStrokeStart) {
                    scene.handleStrokeStart(uniqueId, key);
                }
            }
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
            const id = this.activeRenderTexture.getData('id');
            // Luôn cập nhật strokeColors khi vẽ post-completion
            if (!this.strokeColors.has(id)) {
                this.strokeColors.set(id, new Set());
            }
            this.strokeColors.get(id)?.add(this.brushColor);
            if (this.activeRenderTexture.getData('isFinished')) {
                // Part đã hoàn thành → chỉ ghi nhận màu post-completion
                const strokeUsedColors = this.strokeColors.get(id) || new Set([this.brushColor]);
                const usedColors = this.partColors.get(id) || new Set([this.brushColor]);
                // Log debug để kiểm tra giá trị thực tế
                console.log('[DEBUG] handlePointerUp post-completion', { id, strokeUsedColors: [...strokeUsedColors], usedColors: [...usedColors] });
                this.strokeColors.delete(id);
                const rt = this.activeRenderTexture;
                const key = rt.getData('key');
                const partScale = rt.getData('partScale') as number;
                const scale = 16;
                const strokeRT = rt.getData('strokeRT') as Phaser.GameObjects.RenderTexture | undefined;

                // Đếm px từ stroke RT (chỉ nét tô trong attempt này), không dùng rt (đã 100% từ attempt 1)
                const rtToSnapshot = strokeRT || rt;
                rtToSnapshot.snapshot((snapshot) => {
                    if (!(snapshot instanceof HTMLImageElement)) {
                        this.onPostCompletionStroke(id, strokeUsedColors, usedColors, 0);
                        return;
                    }
                    const sourceImg = this.scene.textures.get(key).getSourceImage() as HTMLImageElement;
                    const checkW = Math.floor(sourceImg.width * partScale / 4);
                    const checkH = Math.floor(sourceImg.height * partScale / 4);

                    const ctxPaint = this.getRecycledContext(this.helperCanvasPaint, snapshot, checkW, checkH);
                    const ctxMask = this.getRecycledContext(this.helperCanvasMask, sourceImg, checkW, checkH);
                    let match = 0;
                    if (ctxPaint && ctxMask) {
                        const paintData = ctxPaint.getImageData(0, 0, checkW, checkH).data;
                        const maskData = ctxMask.getImageData(0, 0, checkW, checkH).data;
                        for (let i = 3; i < paintData.length; i += 4) {
                            if (maskData[i] > 0 && paintData[i] > 0) {
                                match++;
                            }
                        }
                    }
                    this.onPostCompletionStroke(id, strokeUsedColors, usedColors, match * scale);
                });
            } else {
                this.checkProgress(this.activeRenderTexture);
            }
            this.activeRenderTexture = null;
        }
    }

    // ✅ HÀM PAINT MỚI: DÙNG LERP ĐỂ VẼ MƯỢT
    private paint(pointer: Phaser.Input.Pointer, rt: Phaser.GameObjects.RenderTexture) {
        // 1. Lấy toạ độ hiện tại (Local)
        const currentX = pointer.x - rt.x;
        const currentY = pointer.y - rt.y;

        // 2. Tính khoảng cách
        const distance = Phaser.Math.Distance.Between(this.lastX, this.lastY, currentX, currentY);

        // Tối ưu: Nếu di chuyển quá ít (< 1px) thì bỏ qua
        if (distance < 1) return;

        // 3. Thuật toán LERP (Nội suy)
        const stepSize = this.brushSize / 4; // Mật độ vẽ
        const steps = Math.ceil(distance / stepSize);
        const offset = this.brushSize / 2;

        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const interpX = this.lastX + (currentX - this.lastX) * t;
            const interpY = this.lastY + (currentY - this.lastY) * t;

            if (this.isErasing) {
                rt.erase(this.brushTexture, interpX - offset, interpY - offset);
            } else {
                rt.draw(this.brushTexture, interpX - offset, interpY - offset, 1.0, this.brushColor);
                if (rt.getData('isFinished')) {
                    const strokeRT = rt.getData('strokeRT') as Phaser.GameObjects.RenderTexture | undefined;
                    if (strokeRT) strokeRT.draw(this.brushTexture, interpX - offset, interpY - offset, 1.0, this.brushColor);
                }
            }
        }

        // Vẽ chốt hạ tại điểm cuối
        if (this.isErasing) {
            rt.erase(this.brushTexture, currentX - offset, currentY - offset);
        } else {
            rt.draw(this.brushTexture, currentX - offset, currentY - offset, 1.0, this.brushColor);
            if (rt.getData('isFinished')) {
                const strokeRT = rt.getData('strokeRT') as Phaser.GameObjects.RenderTexture | undefined;
                if (strokeRT) strokeRT.draw(this.brushTexture, currentX - offset, currentY - offset, 1.0, this.brushColor);
            }

            // ✅ LOGIC LƯU MÀU: Thêm màu hiện tại vào danh sách
            const id = rt.getData('id');
            if (!this.partColors.has(id)) {
                this.partColors.set(id, new Set());
            }
            this.partColors.get(id)?.add(this.brushColor);

            // ✅ LOGIC MÀU PER-STROKE: Thêm màu vào danh sách stroke hiện tại
            if (!this.strokeColors.has(id)) {
                this.strokeColors.set(id, new Set());
            }
            this.strokeColors.get(id)?.add(this.brushColor);
        }

        // 4. Cập nhật vị trí cũ
        this.lastX = currentX;
        this.lastY = currentY;
    }

    // ✅ HÀM CHECK PROGRESS MỚI: TỐI ƯU BỘ NHỚ
    private checkProgress(rt: Phaser.GameObjects.RenderTexture) {
        if (rt.getData('isFinished')) return;

        const id = rt.getData('id');
        const key = rt.getData('key');

        // ✅ FIX RACE CONDITION: Capture strokeColors/partColors ĐỒNG BỘ trước khi gọi snapshot (ASYNC)
        // Nếu không, stroke tiếp theo có thể ghi thêm màu vào strokeColors
        // trước khi callback chạy → gây lặp/nhiễm màu giữa các stroke
        const capturedStrokeColors = this.strokeColors.get(id) || new Set([this.brushColor]);
        const capturedPartColors = this.partColors.get(id) || new Set([this.brushColor]);
        this.strokeColors.delete(id); // Xóa ngay để stroke tiếp theo bắt đầu Set mới

        // ✅ FIX DETERMINISM: Dùng area_px đã tính sẵn (lưu trên RT khi khởi tạo)
        // thay vì đếm lại total từ mask canvas mỗi lần → đảm bảo total luôn nhất quán
        const storedAreaPx = rt.getData('area_px') as number || 0;
        const precomputedTotal = storedAreaPx > 0 ? storedAreaPx / 16 : 0;

        rt.snapshot((snapshot) => {
            if (!(snapshot instanceof HTMLImageElement)) return;

            // ✅ FIX: Dùng sourceImg + scale để tính checkW/checkH — CÙNG formula với computeAreaPx
            // Tránh lệch do Phaser round float → int khi tạo RT framebuffer
            const sourceImg = this.scene.textures.get(key).getSourceImage() as HTMLImageElement;
            const partScale = rt.getData('partScale') as number;
            const checkW = Math.floor(sourceImg.width * partScale / 4);
            const checkH = Math.floor(sourceImg.height * partScale / 4);

            // ✅ TÁI SỬ DỤNG CANVAS (Không tạo mới)
            const ctxPaint = this.getRecycledContext(this.helperCanvasPaint, snapshot, checkW, checkH);
            const ctxMask = this.getRecycledContext(this.helperCanvasMask, sourceImg, checkW, checkH);

            if (!ctxPaint || !ctxMask) return;

            const paintData = ctxPaint.getImageData(0, 0, checkW, checkH).data;
            const maskData = ctxMask.getImageData(0, 0, checkW, checkH).data;

            let match = 0;

            // Đếm số pixel đã tô TRONG vùng mask
            for (let i = 3; i < paintData.length; i += 4) {
                if (maskData[i] > 0 && paintData[i] > 0) {
                    match++;
                }
            }

            // ✅ Dùng precomputedTotal (từ area_px đã cache) thay vì đếm lại total
            // → Đảm bảo percentage luôn nhất quán giữa các lần chơi
            const total = precomputedTotal;
            const percentage = total > 0 ? match / total : 0;

            const scale = 16; // checkW = w/4, checkH = h/4 → mỗi pixel đại diện 4×4 = 16 pixel gốc

            if (percentage > GameConstants.PAINT.WIN_PERCENT) {
                rt.setData('isFinished', true);

                // Tô đủ → gửi kết quả hoàn thành về Scene
                // Dùng captured colors (đã chụp đồng bộ bên trên) thay vì đọc lại từ Map
                this.onPartComplete(id, rt, capturedPartColors, match * scale, storedAreaPx, capturedStrokeColors);
                // Giữ lại partColors để tracking post-completion color change
            } else {
                // Chưa tô đủ → ghi nhận attempt chưa xong vào SDK history
                // Dùng captured colors (đã chụp đồng bộ bên trên) thay vì đọc lại từ Map
                const scene = this.scene as any;
                if (scene.handleStrokeEnd) {
                    scene.handleStrokeEnd(id, match * scale, storedAreaPx, capturedStrokeColors, capturedPartColors);
                }
            }
        });
    }

    /**
     * Sau khi tẩy, re-check coverage của part đã hoàn thành.
     * Nếu tỉ lệ tô rớt xuống dưới ngưỡng → đánh dấu chưa hoàn thành, thông báo Scene.
     */
    private recheckAfterErase(rt: Phaser.GameObjects.RenderTexture) {
        const id = rt.getData('id');
        const key = rt.getData('key');

        // ✅ FIX DETERMINISM: Dùng area_px đã cache thay vì đếm lại total
        const storedAreaPx = rt.getData('area_px') as number || 0;
        const precomputedTotal = storedAreaPx > 0 ? storedAreaPx / 16 : 0;

        rt.snapshot((snapshot) => {
            if (!(snapshot instanceof HTMLImageElement)) return;

            // ✅ FIX: Dùng sourceImg + scale để tính checkW/checkH — CÙNG formula với computeAreaPx
            const sourceImg = this.scene.textures.get(key).getSourceImage() as HTMLImageElement;
            const partScale = rt.getData('partScale') as number;
            const checkW = Math.floor(sourceImg.width * partScale / 4);
            const checkH = Math.floor(sourceImg.height * partScale / 4);

            const ctxPaint = this.getRecycledContext(this.helperCanvasPaint, snapshot, checkW, checkH);
            const ctxMask = this.getRecycledContext(this.helperCanvasMask, sourceImg, checkW, checkH);

            if (!ctxPaint || !ctxMask) return;

            const paintData = ctxPaint.getImageData(0, 0, checkW, checkH).data;
            const maskData = ctxMask.getImageData(0, 0, checkW, checkH).data;

            let match = 0;

            for (let i = 3; i < paintData.length; i += 4) {
                if (maskData[i] > 0 && paintData[i] > 0) {
                    match++;
                }
            }

            // ✅ Dùng precomputedTotal để đảm bảo ngưỡng uncomplete nhất quán với ngưỡng complete
            const total = precomputedTotal;
            const percentage = total > 0 ? match / total : 0;

            if (percentage <= GameConstants.PAINT.WIN_PERCENT) {
                // Coverage rớt dưới ngưỡng → đánh dấu chưa hoàn thành
                rt.setData('isFinished', false);
                this.onPartUncomplete(id, rt);
                console.log(`[PaintManager] Part ${id} uncompleted after erase (coverage: ${(percentage * 100).toFixed(1)}%)`);
            }
        });
    }

    /**
     * Tính area_px của texture tại CÙNG resolution với checkProgress (1/4 × 16).
     * Gọi 1 lần khi tạo level để có giá trị chính xác, nhất quán.
     */
    public computeAreaPx(textureKey: string, scale: number): number {
        try {
            const sourceImg = this.scene.textures.get(textureKey).getSourceImage() as HTMLImageElement;
            const rtW = sourceImg.width * scale;
            const rtH = sourceImg.height * scale;
            const checkW = Math.floor(rtW / 4);
            const checkH = Math.floor(rtH / 4);
            if (checkW <= 0 || checkH <= 0) return 0;

            const ctx = this.getRecycledContext(this.helperCanvasMask, sourceImg, checkW, checkH);
            if (!ctx) return 0;

            const data = ctx.getImageData(0, 0, checkW, checkH).data;
            let count = 0;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 0) count++;
            }
            return count * 16; // 1/4 width × 1/4 height = mỗi pixel đại diện 16 pixel gốc
        } catch (e) {
            console.warn('computeAreaPx failed for', textureKey, e);
            return 0;
        }
    }

    // Hàm helper để tái sử dụng Context
    private getRecycledContext(canvas: HTMLCanvasElement, img: HTMLImageElement, w: number, h: number) {
        canvas.width = w; // Set lại width tự động clear nội dung cũ
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // ✅ FIX: Tắt bilinear interpolation → dùng nearest-neighbor
            // Đảm bảo đếm pixel deterministic giữa các lần chơi
            // (bilinear tạo alpha "nửa vời" ở rìa mask, giá trị không ổn định qua các lần render)
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, w, h); // Clear chắc chắn lần nữa
            ctx.drawImage(img, 0, 0, w, h);
        }
        return ctx;
    }
}