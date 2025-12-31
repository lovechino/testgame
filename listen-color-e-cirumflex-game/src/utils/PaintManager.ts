import Phaser from 'phaser';
import { GameConstants } from '../consts/GameConstants';

export class PaintManager {
    private scene: Phaser.Scene;

    private totalDistancePainted: number = 0; 
    private readonly CHECK_THRESHOLD: number = 300; // Vẽ đủ 300px mới check
    
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

    // ✅ TỐI ƯU RAM: Tạo sẵn Canvas tạm để tái sử dụng, không new mới liên tục
    private helperCanvasPaint: HTMLCanvasElement;
    private helperCanvasMask: HTMLCanvasElement;

    // Callback trả về cả Set màu thay vì 1 màu lẻ
    private onPartComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void;

    constructor(scene: Phaser.Scene, onComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void) {
        this.scene = scene;
        this.onPartComplete = onComplete;
        
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

    public createPaintableLayer(x: number, y: number, key: string,frame: string, scale: number, uniqueId: string): Phaser.GameObjects.Image {
        const maskImage = this.scene.make.image({ x, y, key, frame: frame, add: false }).setScale(scale);
        const mask = maskImage.createBitmapMask();

        const rtW = maskImage.width * scale;
        const rtH = maskImage.height * scale;
        const rt = this.scene.add.renderTexture(x - rtW/2, y - rtH/2, rtW, rtH);
        
        rt.setOrigin(0, 0).setMask(mask).setDepth(10);
        rt.setData('id', uniqueId);
        rt.setData('key', key);
        rt.setData('frame', frame); 
        rt.setData('isFinished', false);

        const hitArea = this.scene.add.image(x, y, key, frame).setScale(scale).setAlpha(0.01).setDepth(50);
        hitArea.setInteractive({ useHandCursor: true, pixelPerfect: true });

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.activeRenderTexture = rt;
            
            // ✅ QUAN TRỌNG: Lưu vị trí bắt đầu để tính toán LERP
            this.lastX = pointer.x - rt.x;
            this.lastY = pointer.y - rt.y;

            this.totalDistancePainted = 0;

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
            // CHỈ CHECK NẾU VẼ ĐỦ NHIỀU
            if (this.totalDistancePainted > this.CHECK_THRESHOLD) {
                this.checkProgress(this.activeRenderTexture);
            }
            this.activeRenderTexture = null;
            this.totalDistancePainted = 0; // Reset
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
        if (distance < 2) return;


        // 3. Thuật toán LERP (Nội suy)
        // GIẢM MẬT ĐỘ VẼ: Vẽ thưa hơn
        const stepSize = this.brushSize / 2; 
        
        //GIỚI HẠN VÒNG LẶP: Tránh treo máy
        let steps = Math.ceil(distance / stepSize);
        if (steps > 50) steps = 50;
        const offset = this.brushSize / 2

        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const interpX = this.lastX + (currentX - this.lastX) * t;
            const interpY = this.lastY + (currentY - this.lastY) * t;

            if (this.isErasing) {
                rt.erase(this.brushTexture, interpX - offset, interpY - offset);
            } else {
                rt.draw(this.brushTexture, interpX - offset, interpY - offset, 1.0, this.brushColor);
            }
        }

        // 3. CỘNG DỒN QUÃNG ĐƯỜNG
        if (!this.isErasing) {
            this.totalDistancePainted += distance;
        }

        // Vẽ chốt hạ tại điểm cuối
        if (this.isErasing) {
            rt.erase(this.brushTexture, currentX - offset, currentY - offset);
        } else {
            rt.draw(this.brushTexture, currentX - offset, currentY - offset, 1.0, this.brushColor);
            
            // ✅ LOGIC LƯU MÀU: Thêm màu hiện tại vào danh sách
            const id = rt.getData('id');
            if (!this.partColors.has(id)) {
                this.partColors.set(id, new Set());
            }
            this.partColors.get(id)?.add(this.brushColor);
        }

        // 4. Cập nhật vị trí cũ
        this.lastX = currentX;
        this.lastY = currentY;
    }

    // ✅ HÀM CHECK PROGRESS ĐÃ SỬA LỖI ATLAS
    private checkProgress(rt: Phaser.GameObjects.RenderTexture) {
        if (rt.getData('isFinished')) return;
        
        const id = rt.getData('id');
        const key = rt.getData('key');
        const frameName = rt.getData('frame');

        rt.snapshot((snapshot) => {
            if (!(snapshot instanceof HTMLImageElement)) return;
            
            const w = snapshot.width;
            const h = snapshot.height;
            const checkW = Math.floor(w / 4);
            const checkH = Math.floor(h / 4);

            // 1. Lấy mẫu nét vẽ (PAINT) - Giữ nguyên
            const ctxPaint = this.getRecycledContext(this.helperCanvasPaint, snapshot, checkW, checkH);

            // 2. Lấy mẫu hình gốc (MASK) - PHẢI SỬA ĐOẠN NÀY
            // Không dùng getRecycledContext được nữa vì ta cần cắt ảnh
            this.helperCanvasMask.width = checkW;
            this.helperCanvasMask.height = checkH;
            const ctxMask = this.helperCanvasMask.getContext('2d');

            if (!ctxPaint || !ctxMask) return;

            // Xóa sạch canvas mask trước khi vẽ
            ctxMask.clearRect(0, 0, checkW, checkH);

            // Lấy thông tin tọa độ cắt từ Atlas
            const texture = this.scene.textures.get(key);
            const frame = texture.get(frameName);

            // 🔥 CẮT ẢNH TỪ ATLAS (QUAN TRỌNG NHẤT) 🔥
            ctxMask.drawImage(
                frame.source.image as CanvasImageSource, // Ảnh nguồn (Atlas to)
                frame.cutX, frame.cutY,          // Tọa độ cắt (X, Y trên Atlas)
                frame.cutWidth, frame.cutHeight, // Kích thước vùng cắt
                0, 0, checkW, checkH             // Vẽ đè lên canvas kiểm tra
            );

            // 3. So sánh Pixel
            const paintData = ctxPaint.getImageData(0, 0, checkW, checkH).data;
            const maskData = ctxMask.getImageData(0, 0, checkW, checkH).data;

            let match = 0;
            let total = 0;

            for (let i = 3; i < paintData.length; i += 4) {
                if (maskData[i] > 0) { // Nếu pixel thuộc vùng mask (hình con búp bê)
                    total++;
                    if (paintData[i] > 0) match++; // Nếu đã được tô
                }
            }

            const percentage = total > 0 ? match / total : 0;
            
            // ✅ THÊM LOG ĐỂ BẠN CHECK (CẢNH BÁO)
            console.log(`[Paint Check] Part: ${id} | Progress: ${(percentage * 100).toFixed(1)}%`);

            if (percentage > GameConstants.PAINT.WIN_PERCENT) {
                console.log(`>>> HOÀN THÀNH: ${id}`); // Log khi thắng
                rt.setData('isFinished', true);
                
                const usedColors = this.partColors.get(id) || new Set([this.brushColor]);
                this.onPartComplete(id, rt, usedColors);
                this.partColors.delete(id);
            }
        });
    }

    // Hàm helper để tái sử dụng Context
    private getRecycledContext(canvas: HTMLCanvasElement, img: HTMLImageElement, w: number, h: number) {
        canvas.width = w; // Set lại width tự động clear nội dung cũ
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, w, h); // Clear chắc chắn lần nữa
            ctx.drawImage(img, 0, 0, w, h);
        }
        return ctx;
    }
}