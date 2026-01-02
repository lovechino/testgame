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
    private lastX: number = 0;
    private lastY: number = 0;

    // 🔥 QUẢN LÝ ACTIVE PART ĐỂ TỐI ƯU HIỆU NĂNG
    // Biến này lưu giữ bộ phận duy nhất đang ở dạng RenderTexture
    private activeHitArea: Phaser.GameObjects.Image | null = null;

    private partColors: Map<string, Set<number>> = new Map();
    private helperCanvasPaint: HTMLCanvasElement;
    private helperCanvasMask: HTMLCanvasElement;

    private onPartComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void;

    constructor(scene: Phaser.Scene, onComplete: (id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) => void) {
        this.scene = scene;
        this.onPartComplete = onComplete;
        this.scene.input.topOnly = false;
        
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

    // -------------------------------------------------------------------------
    // 🔥 LOGIC KHỞI TẠO LAYER (Đã thêm tham số depth)
    // -------------------------------------------------------------------------
    public createPaintableLayer(x: number, y: number, key: string, frameName: string, scale: number, uniqueId: string, depth: number): Phaser.GameObjects.Image {
        // Chỉ tạo vùng chạm (HitArea), CHƯA tạo RenderTexture vội
        const hitArea = this.scene.add.image(x, y, key, frameName)
            .setScale(scale)
            .setAlpha(0.01)
            .setDepth(50); 
            
        // Lưu cấu hình vào data để dùng cho việc Freeze/Unfreeze sau này
        hitArea.setData('config', { x, y, key, frameName, scale, uniqueId, depth });
        hitArea.setData('currentObj', null); // Có thể là RT hoặc Image

        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Check Alpha thủ công (Click xuyên thấu)
            const localX = (pointer.x - hitArea.x) / hitArea.scaleX + hitArea.width * hitArea.originX;
            const localY = (pointer.y - hitArea.y) / hitArea.scaleY + hitArea.height * hitArea.originY;
            const alpha = this.scene.textures.getPixelAlpha(localX, localY, key, frameName);
            if (alpha < 50) return;

            // 🔥 CƠ CHẾ CHUYỂN ĐỔI THÔNG MINH (SWITCHING) 🔥
            // Nếu người chơi chạm vào một bộ phận MỚI (khác cái đang tô)
            if (this.activeHitArea !== hitArea) {
                
                // 1. Đóng băng cái cũ (Biến RT cũ -> Image) để giải phóng GPU
                if (this.activeHitArea) {
                    this.freezePart(this.activeHitArea);
                }
                
                // 2. Rã đông cái mới (Biến Image/Null -> RT) để bắt đầu tô
                this.unfreezePart(hitArea);
                this.activeHitArea = hitArea;
            }

            // Lấy RT (chắc chắn đã có sau khi unfreeze)
            const rt = hitArea.getData('currentObj') as Phaser.GameObjects.RenderTexture;
            
            this.activeRenderTexture = rt;
            this.lastX = pointer.x - rt.x;
            this.lastY = pointer.y - rt.y;
            this.totalDistancePainted = 0;
            this.paint(pointer, rt);
        });

        return hitArea;
    }

    // -------------------------------------------------------------------------
    // 🔥 CÁC HÀM XỬ LÝ ĐÓNG BĂNG/RÃ ĐÔNG (CORE BEST PRACTICE)
    // -------------------------------------------------------------------------

    // Chuyển Image -> RenderTexture (Để tô tiếp)
    private unfreezePart(hitArea: Phaser.GameObjects.Image) {
        let currentObj = hitArea.getData('currentObj');

        // Nếu đã là RT rồi thì thôi, không cần làm gì
        if (currentObj instanceof Phaser.GameObjects.RenderTexture) return;

        // Tạo RT mới từ config đã lưu
        const rt = this.initRenderTexture(hitArea);

        // Nếu trước đó là Image (tức là đã tô dở và bị đóng băng), ta phải chép nét vẽ cũ vào
        if (currentObj instanceof Phaser.GameObjects.Image) {
            // Vẽ ảnh cũ đè lên RT mới để bảo lưu công sức tô màu
            rt.draw(currentObj, 0, 0); 
            // Xóa ảnh tĩnh đi vì giờ đã có RT thay thế
            currentObj.destroy();
        }

        // Cập nhật tham chiếu
        hitArea.setData('currentObj', rt);
        // console.log(`Unfrozen (Active): ${hitArea.getData('config').uniqueId}`);
    }

    // Chuyển RenderTexture -> Image (Để nhẹ máy)
    private freezePart(hitArea: Phaser.GameObjects.Image) {
        const rt = hitArea.getData('currentObj');
        
        // Chỉ đóng băng nếu nó đang là RT
        if (rt instanceof Phaser.GameObjects.RenderTexture) {
            // Gọi hàm bake để biến nó thành ảnh tĩnh
            this.bakePart(rt, (bakedImage) => {
                hitArea.setData('currentObj', bakedImage);
                // console.log(`Frozen (Passive): ${hitArea.getData('config').uniqueId}`);
            });
        }
    }

    // Hàm tạo RT cơ bản (Private)
    private initRenderTexture(hitArea: Phaser.GameObjects.Image): Phaser.GameObjects.RenderTexture {
        const cfg = hitArea.getData('config');
        const texture = this.scene.textures.get(cfg.key);
        const frameData = texture.get(cfg.frameName);

        const maskImage = this.scene.make.image({ x: cfg.x, y: cfg.y, key: cfg.key, frame: cfg.frameName, add: false }).setScale(cfg.scale);
        const mask = maskImage.createBitmapMask();

        const rtW = frameData.cutWidth * cfg.scale;
        const rtH = frameData.cutHeight * cfg.scale;
        const rtX = cfg.x - (frameData.realWidth * cfg.scale) / 2 + (frameData.x * cfg.scale);
        const rtY = cfg.y - (frameData.realHeight * cfg.scale) / 2 + (frameData.y * cfg.scale);

        const rt = this.scene.add.renderTexture(rtX, rtY, rtW, rtH);
        rt.setOrigin(0, 0).setMask(mask).setDepth(cfg.depth);

        rt.setData('id', cfg.uniqueId);
        rt.setData('key', cfg.key);
        rt.setData('frame', cfg.frameName); 
        // Bảo lưu trạng thái Win nếu đã từng thắng
        rt.setData('isFinished', hitArea.getData('isFinished') || false); 

        return rt;
    }

    // Hàm biến RT thành Image và Destroy RT
    private bakePart(rt: Phaser.GameObjects.RenderTexture, callback: (img: Phaser.GameObjects.Image) => void) {
        const x = rt.x;
        const y = rt.y;
        const depth = rt.depth;
        const key = rt.getData('key');
        const frameName = rt.getData('frame');
        const id = rt.getData('id');

        rt.snapshot((snapshot) => {
            if (!(snapshot instanceof HTMLImageElement)) return;

            const canvas = document.createElement('canvas');
            canvas.width = snapshot.width;
            canvas.height = snapshot.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. Vẽ hình snapshot từ RT
            ctx.drawImage(snapshot, 0, 0);

            // 2. Cắt viền bằng Mask (quan trọng để ảnh đẹp, không bị răng cưa đen)
            const texture = this.scene.textures.get(key);
            const frame = texture.get(frameName);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(
                frame.source.image as CanvasImageSource,
                frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
                0, 0, snapshot.width, snapshot.height
            );

            // 3. Tạo Texture mới
            const textureKey = `baked_${id}_${Date.now()}`;
            this.scene.textures.addCanvas(textureKey, canvas);

            // 4. Tạo Game Object Image thay thế
            const bakedImage = this.scene.add.image(x, y, textureKey);
            bakedImage.setOrigin(0, 0).setDepth(depth);

            // 5. Tiêu hủy RT nặng nề
            rt.destroy();
            callback(bakedImage);
        });
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
            // Delay check một chút để đảm bảo nét vẽ cuối đã render
            if (this.totalDistancePainted > this.CHECK_THRESHOLD) {
                this.totalDistancePainted = 0; 
                setTimeout(() => {
                    // Kiểm tra RT còn sống không (vì có thể đã bị bake nếu click nhanh quá)
                    if (rtToCheck && rtToCheck.scene && rtToCheck.active) {
                        this.checkProgress(rtToCheck);
                    }
                }, 50);
            }
            this.activeRenderTexture = null;
        }
    }

    private paint(pointer: Phaser.Input.Pointer, rt: Phaser.GameObjects.RenderTexture) {
        const currentX = pointer.x - rt.x;
        const currentY = pointer.y - rt.y;
        const distance = Phaser.Math.Distance.Between(this.lastX, this.lastY, currentX, currentY);

        if (distance < 2) return;

        const stepSize = this.brushSize * 0.65; 
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

        if (!this.isErasing) this.totalDistancePainted += distance;

        if (this.isErasing) {
            rt.erase(this.brushTexture, currentX - offset, currentY - offset);
        } else {
            rt.draw(this.brushTexture, currentX - offset, currentY - offset, 1.0, this.brushColor);
            const id = rt.getData('id');
            if (!this.partColors.has(id)) this.partColors.set(id, new Set());
            this.partColors.get(id)?.add(this.brushColor);
        }

        this.lastX = currentX;
        this.lastY = currentY;
    }

    private checkProgress(rt: Phaser.GameObjects.RenderTexture) {
        // Nếu đã Win rồi thì thôi check
        if (rt.getData('isFinished')) return;
        
        const id = rt.getData('id');
        const key = rt.getData('key');
        const frameName = rt.getData('frame');

        rt.snapshot((snapshot) => {
            if (!(snapshot instanceof HTMLImageElement)) return;
            
            const FIXED_SIZE = 32; 
            const aspectRatio = snapshot.width / snapshot.height;
            let checkW = FIXED_SIZE;
            let checkH = FIXED_SIZE;
            if (aspectRatio > 1) checkH = Math.floor(FIXED_SIZE / aspectRatio);
            else checkW = Math.floor(FIXED_SIZE * aspectRatio);

            const ctxPaint = this.getRecycledContext(this.helperCanvasPaint, snapshot, checkW, checkH);
            this.helperCanvasMask.width = checkW;
            this.helperCanvasMask.height = checkH;
            const ctxMask = this.helperCanvasMask.getContext('2d');

            if (!ctxPaint || !ctxMask) return;

            ctxMask.clearRect(0, 0, checkW, checkH);
            const texture = this.scene.textures.get(key);
            const frame = texture.get(frameName);
            ctxMask.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, checkW, checkH);

            const paintData = ctxPaint.getImageData(0, 0, checkW, checkH).data;
            const maskData = ctxMask.getImageData(0, 0, checkW, checkH).data;

            let match = 0, total = 0;
            for (let i = 3; i < paintData.length; i += 4) {
                if (maskData[i] > 0) {
                    total++;
                    if (paintData[i] > 0) match++;
                }
            }

            const percentage = total > 0 ? match / total : 0;
            
            if (percentage > GameConstants.PAINT.WIN_PERCENT) {
                console.log(`>>> WIN PART: ${id}`);
                
                // Đánh dấu RT là xong
                rt.setData('isFinished', true);
                
                // Lưu trạng thái vào HitArea cha để sau này Unfreeze còn nhớ
                const hitArea = this.activeHitArea;
                if (hitArea) hitArea.setData('isFinished', true);

                const usedColors = this.partColors.get(id) || new Set([this.brushColor]);
                this.onPartComplete(id, rt, usedColors);
            }
        });
    }

    private getRecycledContext(canvas: HTMLCanvasElement, img: HTMLImageElement, w: number, h: number) {
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.clearRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h); }
        return ctx;
    }
}