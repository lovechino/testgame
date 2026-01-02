import Phaser from 'phaser';
import { GameConstants } from '../consts/GameConstants';

export class PaintManager {
    private scene: Phaser.Scene;

    private totalDistancePainted: number = 0; 
    private readonly CHECK_THRESHOLD: number = 30; 
    
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
        // 🔥 THÊM DÒNG NÀY: Cho phép Phaser tìm kiếm các object bên dưới nếu object trên bỏ qua
        this.scene.input.topOnly = false;
        
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

    public createPaintableLayer(x: number, y: number, key: string, frameName: string, scale: number, uniqueId: string): Phaser.GameObjects.Image {
        // 1. Lấy thông tin frame từ Atlas để tính toán kích thước THỰC TẾ (Bé xíu)
        const texture = this.scene.textures.get(key);
        const frameData = texture.get(frameName);

        // 2. Tạo Mask Image (Giữ nguyên logic cũ để làm mặt nạ)
        const maskImage = this.scene.make.image({ x, y, key, frame: frameName, add: false }).setScale(scale);
        const mask = maskImage.createBitmapMask();

        // --- 🔥 SỬA ĐOẠN NÀY ĐỂ FIX LAG 🔥 ---
        
        // Thay vì lấy maskImage.width (Full size 1920x1080), ta lấy kích thước đã cắt (Ví dụ: 200x300)
        const rtW = frameData.cutWidth * scale;
        const rtH = frameData.cutHeight * scale;

        // Tính toán vị trí đặt Render Texture (Phải đặt lệch đi để khớp với hình hiển thị)
        // Công thức: Tọa độ Gốc - Một nửa kích thước gốc + Độ lệch trim + Một nửa kích thước mới
        // (Hoặc đơn giản hơn: Căn theo toạ độ lệch của frame)
        const rtX = x - (frameData.realWidth * scale) / 2 + (frameData.x * scale);
        const rtY = y - (frameData.realHeight * scale) / 2 + (frameData.y * scale);

        // Tạo Render Texture bé xinh (chỉ chứa đúng hình cái tay/chân)
        const rt = this.scene.add.renderTexture(rtX, rtY, rtW, rtH);
        
        rt.setOrigin(0, 0)
          .setMask(mask)
          .setDepth(10);
          
        rt.setData('id', uniqueId);
        rt.setData('key', key);
        rt.setData('frame', frameName); 
        rt.setData('isFinished', false);

        // 3. Tạo HitArea (Vùng chạm) - Cái này vẫn để Full Size để dễ bắt sự kiện
        const hitArea = this.scene.add.image(x, y, key, frameName)
            .setScale(scale)
            .setAlpha(0.01) // Gần như trong suốt
            .setDepth(50);
            
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // 1. Nếu đang vẽ dở cái khác thì thôi
            if (this.activeRenderTexture) return;
            // 2. CHECK THỦ CÔNG: Tính toạ độ click trên ảnh gốc
            // (Chuyển đổi từ toạ độ màn hình -> toạ độ nội bộ của ảnh)
            const localX = (pointer.x - hitArea.x) / hitArea.scaleX + hitArea.width * hitArea.originX;
            const localY = (pointer.y - hitArea.y) / hitArea.scaleY + hitArea.height * hitArea.originY;
            // 3. Lấy độ trong suốt (Alpha) tại điểm đó
            const alpha = this.scene.textures.getPixelAlpha(localX, localY, key, frameName);

            // 4. Nếu click vào vùng trong suốt (Alpha < 255) -> BỎ QUA NGAY
            // Để sự kiện trôi xuống layer bên dưới (nhờ topOnly = false)
            if (alpha < 200) {
                return; 
            }

            // 5. Nếu trúng vùng có màu -> Bắt đầu vẽ
            this.activeRenderTexture = rt;
            this.lastX = pointer.x - rt.x;
            this.lastY = pointer.y - rt.y;
            this.totalDistancePainted = 0;
            this.paint(pointer, rt);
        });

        // Debug: Bỏ comment dòng này để xem kích thước thật sự (Nó phải bé tầm 200-300px mới đúng)
        // console.log(`Created RT ${uniqueId}: ${rtW}x${rtH}`);

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
            const rtToCheck = this.activeRenderTexture;

            // Kiểm tra xem tổng quãng đường đã vẽ (tích lũy từ các lần trước) có đủ lớn không
            if (this.totalDistancePainted > this.CHECK_THRESHOLD) {
                
                // ✅ FIX: Chỉ reset biến đếm KHI VÀ CHỈ KHI chúng ta thực hiện check
                this.totalDistancePainted = 0; 

                setTimeout(() => {
                    if (rtToCheck && rtToCheck.scene && rtToCheck.active) {
                        this.checkProgress(rtToCheck);
                    }
                }, 50);
            } else {
                // ⚠️ QUAN TRỌNG: Nếu chưa đủ ngưỡng thì KHÔNG ĐƯỢC RESET về 0
                // Để nó cộng dồn tiếp cho lần vẽ sau.
                // (Ví dụ: Lần 1 vẽ 20px, lần 2 vẽ 30px -> Tổng 50px -> Đủ điều kiện check)
                console.log(`Chưa đủ ngưỡng check (${this.totalDistancePainted}/${this.CHECK_THRESHOLD}), đợi nét tiếp theo...`);
            }
            
            this.activeRenderTexture = null;
            // DÒNG CŨ CỦA BẠN LÀ: this.totalDistancePainted = 0; (Ở đây là SAI vì nó xóa công sức vẽ nét ngắn)
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
        const stepSize = this.brushSize *0.65; 
        
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
            
            // 🔥 TỐI ƯU CỰC MẠNH (BEST PRACTICE) 🔥
            // Thay vì chia tỉ lệ (w/4), ta ép về kích thước cố định SIÊU NHỎ (32px).
            // Dù là iPhone 15 hay máy Android đời Tống thì CPU cũng chỉ phải duyệt 32x32 = 1024 điểm ảnh.
            // Tốc độ xử lý sẽ < 2ms (cực nhanh).
            const FIXED_SIZE = 32; 
            
            const aspectRatio = snapshot.width / snapshot.height;
            let checkW = FIXED_SIZE;
            let checkH = FIXED_SIZE;

            // Tính toán kích thước giữ tỉ lệ khung hình
            if (aspectRatio > 1) {
                checkH = Math.floor(FIXED_SIZE / aspectRatio);
            } else {
                checkW = Math.floor(FIXED_SIZE * aspectRatio);
            }

            // 1. Lấy mẫu nét vẽ (PAINT)
            const ctxPaint = this.getRecycledContext(this.helperCanvasPaint, snapshot, checkW, checkH);

            // 2. Lấy mẫu hình gốc (MASK)
            this.helperCanvasMask.width = checkW;
            this.helperCanvasMask.height = checkH;
            const ctxMask = this.helperCanvasMask.getContext('2d');

            if (!ctxPaint || !ctxMask) return;

            // Xóa sạch canvas mask
            ctxMask.clearRect(0, 0, checkW, checkH);

            // Lấy thông tin frame từ Atlas
            const texture = this.scene.textures.get(key);
            const frame = texture.get(frameName);

            // Vẽ Atlas vào (Logic cũ đã chuẩn, giữ nguyên)
            ctxMask.drawImage(
                frame.source.image as CanvasImageSource,
                frame.cutX, frame.cutY,
                frame.cutWidth, frame.cutHeight,
                0, 0, checkW, checkH 
            );

            // 3. So sánh Pixel (Vòng lặp này giờ chạy siêu nhanh vì checkW, checkH rất nhỏ)
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
                console.log(`>>> WIN PART: ${id}`);
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