import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager'; 
import { setGameSceneReference, resetVoiceState } from '../rotateOrientation';

// --- 1. CẤU HÌNH CHỮ Ô ---
const LETTER_CONFIG = {
    baseScale: 0.7, 
    outlineKey: 'o_outline',
    parts: [
        { key: 'o_body', offsetX: 1, offsetY: 2, scale: 0.7 }, 
        { key: 'o_hat',  offsetX: 4, offsetY: 5, scale: 0.71 } 
    ]
};

// --- 2. CẤU HÌNH CÔ GIÁO ---
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
    // Biến logic vẽ
    private brushColor: number = 0xff0000; 
    private activeRenderTexture: Phaser.GameObjects.RenderTexture | null = null; 
    private brushTexture: string = 'brush_circle';
    private brushSize: number = 100; // Kích thước đầu cọ (Bạn chỉnh to nhỏ ở đây)

    // Quản lý nút màu để tạo hiệu ứng phóng to/thu nhỏ
    private paletteButtons: Phaser.GameObjects.Image[] = [];

    // --- 3. CẤU HÌNH BẢNG MÀU (Dùng Ảnh thật) ---
    // Mapping: Ảnh nút nào -> Ra màu gì
    private readonly PALETTE_DATA = [
        { key: 'btn_red',    color: 0xFF595E }, // Ảnh btn_red.png tương ứng màu đỏ
        { key: 'btn_yellow', color: 0xFFCA3A },
        { key: 'btn_green',  color: 0x8AC926 },
        { key: 'btn_blue',   color: 0x1982C4 },
        { key: 'btn_purple', color: 0x6A4C93 },
        { key: 'btn_cream', color: 0xFDFCDC },
        { key: 'btn_black', color: 0x000000 }
    ];

    constructor() {
        super("Scene2");
    }

    private getW() { return this.scale.width; }
    private getH() { return this.scale.height; }
    private pctX(p: number) { return this.getW() * p; }
    private pctY(p: number) { return this.getH() * p; }

    preload() {
        // --- LOAD ẢNH CHỮ Ô ---
        this.load.image('o_outline', 'assets/images/S2/o_outline.png');
        this.load.image('o_hat', 'assets/images/S2/o_hat.png');
        this.load.image('o_body', 'assets/images/S2/o_body.png');

        // --- LOAD ẢNH CÔ GIÁO ---
        this.load.image('co_outline', 'assets/images/S2/teacher.png');
        this.load.image('co_face', 'assets/images/S2/face.png');
        this.load.image('co_hair', 'assets/images/S2/hair.png');
        this.load.image('co_shirt', 'assets/images/S2/body.png');
        this.load.image('co_hands', 'assets/images/S2/hand.png');
        this.load.image('co_book', 'assets/images/S2/book.png');

        // --- LOAD ẢNH NỀN, BẢNG ---
        this.load.image('board_s2', 'assets/images/bg/board_scene_2.png');
        this.load.image('banner_s2', 'assets/images/S2/banner.png');
        this.load.image('text_banner_s2', 'assets/images/S2/text_banner.png');

        // --- LOAD 7 ẢNH NÚT MÀU (QUAN TRỌNG) ---
        // Bạn nhớ đặt tên file trong thư mục đúng như thế này nhé
        this.load.image('btn_red',    'assets/images/color/red.png');
        this.load.image('btn_yellow', 'assets/images/color/yellow.png');
        this.load.image('btn_green',  'assets/images/color/green.png');
        this.load.image('btn_blue',   'assets/images/color/blue.png');
        this.load.image('btn_purple', 'assets/images/color/purple.png');
        this.load.image('btn_cream',   'assets/images/color/cream.png');
        this.load.image('btn_black',   'assets/images/color/black.png');

        // --- TẠO ĐẦU CỌ VẼ (BRUSH) ---
        // Vẫn dùng code tạo hình tròn mờ để nét vẽ mềm mại
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
        setGameSceneReference(this);
        this.creatBroadAndBanner();

        const centerY = this.pctY(0.48);

        // 1. Tạo Cô Giáo (Trái)
        this.createCharacter(this.pctX(0.37), centerY, TEACHER_CONFIG);

        // 2. Tạo Chữ Ô (Phải)
        this.createCharacter(this.pctX(0.7), centerY, LETTER_CONFIG);

        // 3. Tạo Bảng Màu (Ở dưới đáy)
        this.createPalette();

        // 4. Setup sự kiện vẽ
        this.setupInput();
    }

    private creatBroadAndBanner() {
        const bannerS2 = this.add.image(this.pctX(0.5), this.pctY(0.01), 'banner_s2').setOrigin(0.5,0).setScale(0.7);
        this.add.image(this.pctX(0.5), this.pctY(0.03), 'text_banner_s2').setOrigin(0.5,0).setScale(0.7);
        this.add.image(this.pctX(0.5), bannerS2.displayHeight + this.pctY(0.03),'board_s2').setOrigin(0.5,0).setScale(0.7);
    }

    // --- HÀM TẠO BẢNG MÀU TỪ ẢNH ---
    private createPalette() {
        const buttonSpacing = this.pctX(0.07); // Khoảng cách giữa các nút
        const yPos = this.pctY(0.89); // Cách đáy màn hình 80px

        // Tính toán để căn giữa hàng nút
        const totalWidth = (this.PALETTE_DATA.length - 1) * buttonSpacing;
        const startX = (this.getW() - totalWidth) / 2;

        this.PALETTE_DATA.forEach((item, index) => {
            // Tạo nút từ key ảnh (btn_red, btn_blue...)
            const btn = this.add.image(startX + index * buttonSpacing, yPos, item.key);
            
            // Làm cho nút bấm được
            btn.setInteractive({ useHandCursor: true });

            // Mặc định hơi mờ một chút để làm nổi bật nút đang chọn
            btn.setAlpha(0.8);

            btn.on('pointerdown', () => {
                // Set màu cọ
                this.brushColor = item.color;
                
                // Hiệu ứng: Nút chọn thì Sáng + To, Nút khác thì Mờ + Nhỏ
                this.paletteButtons.forEach(b => b.setScale(0.6).setAlpha(0.8));
                btn.setScale(0.8).setAlpha(1);
                
                // AudioManager.play('sfx-click'); 
            });

            this.paletteButtons.push(btn);
        });

        // Mặc định kích hoạt nút đầu tiên
        if (this.paletteButtons.length > 0) {
            this.paletteButtons[0].emit('pointerdown');
        }
    }

    // --- HÀM TẠO NHÂN VẬT ---
    private createCharacter(centerX: number, centerY: number, config: any) {
        config.parts.forEach((part: any) => {
            const x = centerX + part.offsetX;
            const y = centerY + part.offsetY;
            this.createPaintablePart(x, y, part.key, part.scale);
        });

        const outline = this.add.image(centerX, centerY, config.outlineKey);
        outline.setScale(config.baseScale);
        outline.setDepth(100); 
        outline.setInteractive({ pixelPerfect: true }); 
    }

    // --- TẠO LỚP VẼ ---
    private createPaintablePart(x: number, y: number, key: string, scale: number) {
        const maskImage = this.make.image({ x, y, key: key, add: false });
        maskImage.setScale(scale);
        const mask = maskImage.createBitmapMask();

        const rtW = maskImage.width * scale;
        const rtH = maskImage.height * scale;
        
        const rt = this.add.renderTexture(x - rtW/2, y - rtH/2, rtW, rtH);
        rt.setOrigin(0, 0); 
        rt.setMask(mask); 
        rt.setDepth(10);  

        const hitArea = this.add.image(x, y, key).setScale(scale);
        hitArea.setAlpha(0.01); 
        hitArea.setDepth(50); 
        
        hitArea.setInteractive({ useHandCursor: true, pixelPerfect: true });

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.activeRenderTexture = rt;
            this.paint(pointer, rt);
        });
    }

    // --- LOGIC VẼ (CHUẨN TÂM) ---
    private paint(pointer: Phaser.Input.Pointer, rt: Phaser.GameObjects.RenderTexture) {
        const localX = pointer.x - rt.x;
        const localY = pointer.y - rt.y;

        // Tính toán trừ đi nửa kích thước cọ để vẽ đúng tâm
        const offset = this.brushSize / 2;
        rt.draw(this.brushTexture, localX - offset, localY - offset, 1.0, this.brushColor);
    }

    private setupInput() {
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown && this.activeRenderTexture) {
                this.paint(pointer, this.activeRenderTexture);
            }
        });

        this.input.on('pointerup', () => {
            this.activeRenderTexture = null;
        });
    }
}