import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { setGameSceneReference, resetVoiceState } from '../rotateOrientation';

// --- CONFIG ---
const LETTER_CONFIG = {
    baseScale: 0.7,
    outlineKey: 'o_outline',
    parts: [
        { key: 'o_body', offsetX: 1, offsetY: 2, scale: 0.7 },
        { key: 'o_hat',  offsetX: 4, offsetY: 5, scale: 0.71 }
    ]
};

const TEACHER_CONFIG = {
    baseScale: 0.75,
    outlineKey: 'co_outline',
    parts: [
        { key: 'co_hands', offsetX: 0, offsetY: 0, scale: 0.751 },
        { key: 'co_face',  offsetX: 0, offsetY: 0, scale: 0.751 },
        { key: 'co_shirt', offsetX: 0, offsetY: 0, scale: 0.751 },
        { key: 'co_book',  offsetX: 0, offsetY: 0, scale: 0.751 },
        { key: 'co_hair',  offsetX: 0, offsetY: 0, scale: 0.751 }
    ]
};

export default class Scene2 extends Phaser.Scene {
    // Biến vẽ
    private brushColor: number = 0xff0000;
    private activeRenderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private brushTexture: string = 'brush_circle';
    private brushSize: number = 100;

    // Biến trạng thái tẩy
    private isErasing: boolean = false;

    // Biến quản lý game
    private paletteButtons: Phaser.GameObjects.Image[] = [];
    private totalParts: number = 0;
    private finishedParts: Set<string> = new Set();

    private readonly PALETTE_DATA = [
        { key: 'btn_red',    color: 0xFF595E },
        { key: 'btn_yellow', color: 0xFFCA3A },
        { key: 'btn_green',  color: 0x8AC926 },
        { key: 'btn_blue',   color: 0x1982C4 },
        { key: 'btn_purple', color: 0x6A4C93 },
        { key: 'btn_cream',  color: 0xFDFCDC },
        { key: 'btn_black',  color: 0x000000 }
    ];

    constructor() {
        super("Scene2");
    }

    private getW() { 
        return this.scale.width; 
    }
    private getH() { 
        return this.scale.height; 
    }
    private pctX(p: number) { 
        return this.getW() * p; 
    }
    private pctY(p: number) { 
        return this.getH() * p; 
    }

    private resetPaletteState() {
      this.paletteButtons.forEach(b => b.destroy());
      this.paletteButtons.length = 0;
      this.isErasing = false;
      this.brushColor = this.PALETTE_DATA[0].color;
    }

    init() {

        this.totalParts = 0;
        this.finishedParts.clear();
        this.resetPaletteState();
    }

    shutdown() {
            this.resetPaletteState();
    }

    preload() {
        // Load Ảnh Game
        this.load.image('o_outline', 'assets/images/S2/o_outline.png');
        this.load.image('o_hat', 'assets/images/S2/o_hat.png');
        this.load.image('o_body', 'assets/images/S2/o_body.png');
        this.load.image('co_outline', 'assets/images/S2/teacher.png');
        this.load.image('co_face', 'assets/images/S2/face.png');
        this.load.image('co_hair', 'assets/images/S2/hair.png');
        this.load.image('co_shirt', 'assets/images/S2/body.png');
        this.load.image('co_hands', 'assets/images/S2/hand.png');
        this.load.image('co_book', 'assets/images/S2/book.png');
        this.load.image('board_s2', 'assets/images/bg/board_scene_2.png');
        this.load.image('banner_s2', 'assets/images/S2/banner.png');
        this.load.image('text_banner_s2', 'assets/images/S2/text_banner.png');

        // Load Nút Màu
        this.load.image('btn_red',    'assets/images/color/red.png');
        this.load.image('btn_yellow', 'assets/images/color/yellow.png');
        this.load.image('btn_green',  'assets/images/color/green.png');
        this.load.image('btn_blue',   'assets/images/color/blue.png');
        this.load.image('btn_purple', 'assets/images/color/purple.png');
        this.load.image('btn_cream',  'assets/images/color/cream.png');
        this.load.image('btn_black',  'assets/images/color/black.png');

        // Load Ảnh Cục Tẩy
        this.load.image('btn_eraser', 'assets/images/ui/btn_exit.png');

        // Tạo texture cọ
        if (!this.textures.exists('brush_circle')) {
            const canvas = this.textures.createCanvas('brush_circle', this.brushSize, this.brushSize);
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

    create() {
        resetVoiceState();
        (window as any).gameScene = this;
        setGameSceneReference(this);
        const centerY = this.pctY(0.48);

        this.creatBroadAndBanner();
        this.createCharacter(this.pctX(0.37), centerY, TEACHER_CONFIG);
        this.createCharacter(this.pctX(0.7), centerY, LETTER_CONFIG);
        this.createPalette();
        this.setupInput();

    }

    private creatBroadAndBanner() {
        const bannerS2 = this.add.image(this.pctX(0.5), this.pctY(0.01), 'banner_s2').setOrigin(0.5,0).setScale(0.7);
        this.add.image(this.pctX(0.5), this.pctY(0.03), 'text_banner_s2').setOrigin(0.5,0).setScale(0.7);
        this.add.image(this.pctX(0.5), bannerS2.displayHeight + this.pctY(0.03),'board_s2').setOrigin(0.5,0).setScale(0.7);

    }

    private createPalette() {
        const buttonSpacing = this.pctX(0.07);
        const yPos = this.pctY(0.89);

        // Tính tổng chiều rộng gồm: Các nút màu + Nút tẩy
        const totalItems = this.PALETTE_DATA.length + 1; // +1 cho Eraser
        const totalWidth = (totalItems - 1) * buttonSpacing;
        const startX = (this.getW() - totalWidth) / 2;

        // 1. Tạo các nút MÀU
        this.PALETTE_DATA.forEach((item, index) => {
            const btn = this.add.image(startX + index * buttonSpacing, yPos, item.key);
            btn.setInteractive({ useHandCursor: true }).setAlpha(0.8);

            // Logic khi bấm nút MÀU
            btn.on('pointerdown', () => {
                this.isErasing = false; // Tắt tẩy
                this.brushColor = item.color; // Set màu

                // Reset visual tất cả nút (bao gồm tẩy)
                this.paletteButtons.forEach(b => b.setScale(0.6).setAlpha(0.8));

                // Highlight nút này
                btn.setScale(0.8).setAlpha(1);
            });
            this.paletteButtons.push(btn);
        });

        // 2. Tạo nút TẨY (Ở cuối hàng)
        const eraserIndex = this.PALETTE_DATA.length;
        const eraserBtn = this.add.image(startX + eraserIndex * buttonSpacing, yPos, 'btn_eraser');
        eraserBtn.setInteractive({ useHandCursor: true }).setAlpha(0.8);

        // Logic khi bấm nút TẨY
        eraserBtn.on('pointerdown', () => {
            this.isErasing = true; // Bật chế độ tẩy

            // Reset visual tất cả nút màu
            this.paletteButtons.forEach(b => b.setScale(0.6).setAlpha(0.8));

            // Highlight nút tẩy
            eraserBtn.setScale(0.8).setAlpha(1);
        });

        // Thêm nút tẩy vào danh sách để quản lý chung (khi bấm màu thì tẩy cũng nhỏ lại)
        this.paletteButtons.push(eraserBtn);

        // Mặc định chọn màu đầu tiên
        if (this.paletteButtons.length > 0) this.paletteButtons[0].emit('pointerdown');
    }

    // --- HÀM TÍNH MẬT ĐỘ ẢNH (GIÚP TÍNH % CHUẨN) ---
    private getImageDensity(key: string): number {
        const texture = this.textures.get(key);
        const image = texture.getSourceImage() as HTMLImageElement;
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return 1;
        ctx.drawImage(image, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let visiblePixels = 0;

        for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) visiblePixels++;
        }

        // Trả về tỷ lệ pixel có hình / tổng pixel
        // Nếu ảnh rỗng tuếch thì trả về ít nhất là 1 để tránh lỗi chia cho 0
        const density = visiblePixels / (canvas.width * canvas.height);
        return density > 0 ? density : 1;
    }

    private createCharacter(centerX: number, centerY: number, config: any) {
        config.parts.forEach((part: any, index: number) => {
            const uniqueId = `${part.key}_${index}_${Math.random()}`;
            this.createPaintablePart(centerX + part.offsetX, centerY + part.offsetY, part.key, part.scale, uniqueId);
            this.totalParts++;
        });

        const outline = this.add.image(centerX, centerY, config.outlineKey);
        outline.setScale(config.baseScale).setDepth(100).setInteractive({ pixelPerfect: true });
    }

    private createPaintablePart(x: number, y: number, key: string, scale: number, uniqueId: string) {
        // --- TÍNH MẬT ĐỘ ---
        const density = this.getImageDensity(key);

        const maskImage = this.make.image({ x, y, key: key, add: false }).setScale(scale);
        const mask = maskImage.createBitmapMask();

        const rtW = maskImage.width * scale;
        const rtH = maskImage.height * scale;
        const rt = this.add.renderTexture(x - rtW/2, y - rtH/2, rtW, rtH);

        rt.setOrigin(0, 0).setMask(mask).setDepth(10);
        rt.setData('id', uniqueId);
        rt.setData('isFinished', false);

        // --- LƯU MẬT ĐỘ VÀO RT ĐỂ DÙNG SAU ---
        rt.setData('key', key); // Lưu tên ảnh gốc (ví dụ 'co_shirt') để lát so sánh

        const hitArea = this.add.image(x, y, key).setScale(scale).setAlpha(0.01).setDepth(50);
        hitArea.setInteractive({ useHandCursor: true, pixelPerfect: true });
        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.activeRenderTexture = rt;
            this.paint(pointer, rt);
        });
    }

    // --- LOGIC VẼ VÀ TẨY ---
    private paint(pointer: Phaser.Input.Pointer, rt: Phaser.GameObjects.RenderTexture) {
        const localX = pointer.x - rt.x;
        const localY = pointer.y - rt.y;
        const offset = this.brushSize / 2;

        if (this.isErasing) {
            // --- NẾU LÀ TẨY ---
            rt.erase(this.brushTexture, localX - offset, localY - offset);
        } else {
            // --- NẾU LÀ VẼ ---
            rt.draw(this.brushTexture, localX - offset, localY - offset, 1.0, this.brushColor);
        }
    }

    private setupInput() {
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown && this.activeRenderTexture) {
                this.paint(pointer, this.activeRenderTexture);
            }
        });

        this.input.on('pointerup', () => {
            if (this.isErasing) {
                this.activeRenderTexture = null;
                return;
            }

            if (this.activeRenderTexture) {
                this.checkProgress(this.activeRenderTexture);
                this.activeRenderTexture = null;
            }
        });
    }

    private checkProgress(rt: Phaser.GameObjects.RenderTexture) {
        const id = rt.getData('id');
        const key = rt.getData('key'); // Lấy tên ảnh gốc ra
       
        if (rt.getData('isFinished')) return;

        rt.snapshot((snapshot) => {
            if (!(snapshot instanceof HTMLImageElement)) return;
            // 1. Chuẩn bị Canvas
            const w = snapshot.width;
            const h = snapshot.height;

            // Thu nhỏ 1/4 để tính toán siêu nhanh
            const checkW = Math.floor(w / 4);
            const checkH = Math.floor(h / 4);

            // 2. Lấy dữ liệu NÉT VẼ CỦA BÉ (Paint Data)
            const cvsPaint = document.createElement('canvas');
            cvsPaint.width = checkW;
            cvsPaint.height = checkH;
            const ctxPaint = cvsPaint.getContext('2d');

            if (!ctxPaint) return;
            ctxPaint.drawImage(snapshot, 0, 0, checkW, checkH);
            const paintData = ctxPaint.getImageData(0, 0, checkW, checkH).data;

            // 3. Lấy dữ liệu HÌNH DÁNG GỐC (Mask Data)
            const cvsMask = document.createElement('canvas');
            cvsMask.width = checkW;
            cvsMask.height = checkH;
            const ctxMask = cvsMask.getContext('2d');

            if (!ctxMask) return;

            // Lấy ảnh gốc từ Phaser Texture Manager
            const maskTexture = this.textures.get(key).getSourceImage();
            ctxMask.drawImage(maskTexture as HTMLImageElement, 0, 0, checkW, checkH);
            const maskData = ctxMask.getImageData(0, 0, checkW, checkH).data;

            // 4. SO SÁNH TỪNG PIXEL (Thuật toán Intersection)
            let matchCount = 0;      // Số pixel tô đúng
            let totalMaskPixels = 0; // Tổng số pixel của cái áo

            // Duyệt qua mảng pixel (bước nhảy 4 vì 1 pixel gồm R,G,B,A)
            for (let i = 3; i < paintData.length; i += 4) {
                // Kiểm tra xem pixel này có thuộc cái áo không? (Alpha > 0)
                const isInsideShape = maskData[i] > 0;
                if (isInsideShape) {
                    totalMaskPixels++; // Tính vào tổng diện tích cần tô

                    // Kiểm tra xem bé có tô vào đây không?
                    const isPainted = paintData[i] > 0;
                    if (isPainted) {
                        matchCount++; // Tô trúng!
                    }
                }
            }

            // 5. TÍNH KẾT QUẢ CUỐI CÙNG
            // Tránh chia cho 0 nếu ảnh rỗng
            const percentage = totalMaskPixels > 0 ? (matchCount / totalMaskPixels) : 0;
            console.log(`Tiến độ ${id}: ${(percentage * 100).toFixed(1)}%`);

            // > 90% là cho thắng (Vì thuật toán này rất chuẩn nên có thể để ngưỡng cao)
            if (percentage > 0.90) {
                rt.setData('isFinished', true);
                this.finishedParts.add(id);
                this.tweens.add({ targets: rt, alpha: 0.8, yoyo: true, duration: 100, repeat: 1 });
                this.checkWinCondition();
            }
        });
    }

    private checkWinCondition() {
        console.log(`Đã xong: ${this.finishedParts.size} / ${this.totalParts}`);
        if (this.finishedParts.size >= this.totalParts) {
            console.log("CHIẾN THẮNG!");
            this.time.delayedCall(1000, () => {
                this.scene.start('EndGameScene');
            });
        }
    }
}