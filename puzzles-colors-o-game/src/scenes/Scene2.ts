import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { setGameSceneReference, resetVoiceState, playVoiceLocked } from '../rotateOrientation';

export default class Scene2 extends Phaser.Scene {
    // Biến vẽ
    private brushColor: number = 0xff0000;
    private activeRenderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private brushTexture: string = 'brush_circle';
    private brushSize: number = 100;
    private partColors: Map<string, Set<number>> = new Map();
    private handHint!: Phaser.GameObjects.Image;       // Ảnh bàn tay
    private firstColorBtn!: Phaser.GameObjects.Image;  // Nút màu Đỏ (để tay biết đường bay đến)
    private isIntroActive: boolean = false;             // Biến kiểm soát vòng lặp Intro

    // Biến trạng thái tẩy
    private isErasing: boolean = false;

    // Biến quản lý game
    private paletteButtons: Phaser.GameObjects.Image[] = [];
    private totalParts: number = 0;
    private finishedParts: Set<string> = new Set();

    // --- THÊM VÀO ĐÂY ---
    // Biến cho hệ thống Gợi ý (Idle Hint)
    private idleTimer: number = 0;           // Đếm thời gian
    private readonly IDLE_THRESHOLD = 10000;  // 5 giây
    private activeHintTween: Phaser.Tweens.Tween | null = null; // Tween đang chạy
    
    // Map lưu trữ các bộ phận chưa tô (Key: ID, Value: Image HitArea)
    private unfinishedPartsMap: Map<string, Phaser.GameObjects.Image> = new Map();

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
        this.load.image('co_hand_l', 'assets/images/S2/left_hand.png');
        this.load.image('co_hand_r', 'assets/images/S2/right_hand.png');
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
        this.load.image('btn_eraser', 'assets/images/ui/btn_eraser.png');
        //Tải ảnh bàn tay
        this.load.image('hand_hint', 'assets/images/ui/hand.png');
        this.load.json('level_config', 'assets/data/level_s2_config.json');

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
        //const centerY = this.pctY(0.48);
        const levelData = this.cache.json.get('level_config');

        this.creatBroadAndBanner();
        //this.createCharacter(this.pctX(0.37), centerY, TEACHER_CONFIG);
        //this.createCharacter(this.pctX(0.7), centerY, LETTER_CONFIG);

        this.createCharacter(levelData.teacher);
        this.createCharacter(levelData.letter);
        this.createPalette();
        this.setupInput();

        // TẠO BÀN TAY (Mặc định ẩn)
        this.handHint = this.add.image(0, 0, 'hand_hint')
            .setDepth(200) // Luôn nổi trên cùng
            .setAlpha(0)   
            .setScale(0.7); 

        // GỌI INTRO
        this.playIntroSequence();
        this.events.on('wake', () => {
            console.log("Scene đã thức dậy! Reset bộ đếm giờ.");
            
            // Reset thời gian chờ để người chơi có thời gian định thần lại
            this.idleTimer = 0; 
            
            // Nếu cần thiết, đảm bảo input được bật lại (dù resume tự làm, nhưng chắc ăn)
            if (this.input.keyboard) this.input.keyboard.enabled = true;
        });
    }

    private playIntroSequence() {
        this.isIntroActive = true; // BẬT CỜ LÊN

        // 1. Đọc Voice
        playVoiceLocked(null, 'voice_intro_s2');

        // 2. Chờ voice đọc gần xong (ví dụ 1s) thì bắt đầu diễn
        this.time.delayedCall(1000, () => {
            if (this.isIntroActive) {
                this.showInitialTutorial(); 
            } 
        });
    }

    private stopIntro() {
        // Nếu intro đã tắt rồi thì thôi, không làm gì nữa
        if (!this.isIntroActive) return;

        console.log("Dừng Intro!");
        this.isIntroActive = false; // Gạt cầu dao tắt vòng lặp

        this.idleTimer = 0;

        // Dừng chuyển động bàn tay ngay lập tức
        if (this.handHint) {
            this.tweens.killTweensOf(this.handHint);
            this.handHint.setAlpha(0);
            this.handHint.setPosition(-200, -200); // Cất đi
        }
    }

    private showInitialTutorial() {
        if (!this.firstColorBtn || !this.handHint || !this.isIntroActive) return;

        // Tọa độ mục tiêu
        const colorX = this.firstColorBtn.x + 20; 
        const colorY = this.firstColorBtn.y + 20;
        const targetX = this.pctX(0.37); // Vị trí Cô giáo
        const targetY = this.pctY(0.48);

        // Setup vị trí xuất phát
        this.handHint.setPosition(colorX, colorY);
        this.handHint.setAlpha(0);
        this.handHint.setScale(0.7); // Reset scale

        // --- SỬA LẠI: DÙNG 'CHAIN' THAY CHO 'TIMELINE' ---
        this.tweens.chain({
            targets: this.handHint, // Áp dụng chung cho cái tay
            tweens: [
                {
                    // A. Bay đến nút màu
                    alpha: 1,
                    x: colorX,
                    y: colorY,
                    duration: 600,
                    ease: 'Power2'
                },
                {
                    // B. Ấn nút màu (Thu nhỏ = Ấn xuống)
                    scale: 0.5, 
                    duration: 200,
                    yoyo: true, 
                    repeat: 0.7
                },
                {
                    // C. Bay lên hình Cô giáo
                    x: targetX,
                    y: targetY + 100, 
                    duration: 800,
                    ease: 'Sine.easeInOut',
                    delay: 100 
                },
                {
                    // D. Giả vờ tô (Quẹt quẹt)
                    x: '-=30', 
                    y: '-=10',
                    duration: 400,
                    yoyo: true,
                    repeat: 3, 
                    ease: 'Sine.easeInOut'
                },
                {
                    // E. Biến mất
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        this.handHint.setPosition(-200, -200); 

                        // Nếu Intro vẫn đang bật -> Đợi 1s rồi diễn lại từ đầu
                        if (this.isIntroActive) {
                            this.time.delayedCall(1000, () => {
                                // Gọi đệ quy lại chính hàm này
                                this.showInitialTutorial(); 
                            });
                        }
                    }
                }
            ]
        });
    }

    private creatBroadAndBanner() {
        const bannerS2 = this.add.image(this.pctX(0.5), this.pctY(0.01), 'banner_s2').setOrigin(0.5,0).setScale(0.7);
        this.add.image(this.pctX(0.5), this.pctY(0.04), 'text_banner_s2').setOrigin(0.5,0).setScale(0.7);
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

            // LƯU NÚT ĐẦU TIÊN (MÀU ĐỎ) 
            // Để lát nữa bàn tay biết bay vào chỗ nào
            if (index === 0) {
                this.firstColorBtn = btn;
            }

            // Logic khi bấm nút MÀU
            btn.on('pointerdown', () => {
                this.stopIntro();
                this.resetIdleTimer();
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
            this.stopIntro();
            this.resetIdleTimer();
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

    private createCharacter(config: any) {
        // Tự tính tâm dựa trên % màn hình trong JSON
        const centerX = this.pctX(config.baseX_pct);
        const centerY = this.pctY(config.baseY_pct);

        config.parts.forEach((part: any, index: number) => {
            const uniqueId = `${part.key}_${index}_${Math.random()}`;
            this.createPaintablePart(centerX + part.offsetX, centerY + part.offsetY, part, uniqueId);
            this.totalParts++;
        });

        const outline = this.add.image(centerX, centerY, config.outlineKey);
        outline.setScale(config.baseScale).setDepth(100).setInteractive({ pixelPerfect: true });
    }

    private createPaintablePart(x: number, y: number, partConfig: any, uniqueId: string) {

        // Lấy dữ liệu từ object ra
        const key = partConfig.key;
        const scale = partConfig.scale;

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

        hitArea.setData('originScale', scale); // Lưu scale gốc
        // --- THÊM MỚI: LƯU TỌA ĐỘ HINT VÀO DATA ---
        hitArea.setData('hintX', partConfig.hintX || 0);
        hitArea.setData('hintY', partConfig.hintY || 0);
        this.unfinishedPartsMap.set(uniqueId, hitArea); // Lưu vào danh sách chưa tô

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.resetIdleTimer();
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

            // --- MỚI: LƯU MÀU ĐÃ DÙNG ---
            const id = rt.getData('id');
            
            // Nếu chưa có danh sách cho phần này thì tạo mới
            if (!this.partColors.has(id)) {
                this.partColors.set(id, new Set());
            }
            
            // Thêm màu hiện tại vào danh sách (Set tự động loại bỏ màu trùng)
            this.partColors.get(id)?.add(this.brushColor);
        }
    }

    private setupInput() {
        this.input.on('pointerdown', () => {

            this.stopIntro();
            this.resetIdleTimer();
        });

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

                // Xóa khỏi danh sách gợi ý để không bao giờ gợi ý lại
            if (this.unfinishedPartsMap.has(id)) {
                const hitArea = this.unfinishedPartsMap.get(id);
                if (hitArea) {
                    this.tweens.killTweensOf(hitArea);
                    //hitArea.destroy(); 
                }
                this.unfinishedPartsMap.delete(id);
            }
                // --- LOGIC AUTO-FILL THÔNG MINH ---
                
                // Lấy danh sách màu đã dùng cho phần này
                const usedColors = this.partColors.get(id);

                // Điều kiện: Chỉ fill nếu bé chỉ dùng DUY NHẤT 1 màu
                // (usedColors && usedColors.size === 1)
                if (usedColors && usedColors.size === 1) {
                    rt.setBlendMode(Phaser.BlendModes.NORMAL);
                    rt.fill(this.brushColor); // Lấp đầy cho đẹp
                } else {
                    console.log("Bé tô nhiều màu, không Auto-Fill để bảo toàn tác phẩm");
                }
                // --- CÁC HIỆU ỨNG KHÁC VẪN CHẠY BÌNH THƯỜNG ---
                AudioManager.play('sfx-ting');

                this.tweens.add({ 
                    targets: rt, 
                    alpha: 0.8, 
                    yoyo: true, 
                    duration: 100, 
                    repeat: 2,
                    onComplete: () => {
                        rt.setAlpha(1);
                    } 
                });
                this.checkWinCondition();
            }
        });
    }

    private checkWinCondition() {
        console.log(`Đã xong: ${this.finishedParts.size} / ${this.totalParts}`);
        if (this.finishedParts.size >= this.totalParts) {
            console.log("CHIẾN THẮNG!");

            AudioManager.play('sfx-correct');
            this.time.delayedCall(2500, () => {
                this.scene.start('EndGameScene');
            });
        }
    }

    // --- HỆ THỐNG GỢI Ý (IDLE HINT) ---

    update(time: number, delta: number) {
        // Kiểm tra xem có đang tô không?
        // (activeRenderTexture khác null nghĩa là đang giữ chuột tô)
        const isPainting = this.activeRenderTexture !== null;

        // Đếm giờ khi: 
        // 1. Game chưa xong
        // 2. Intro đã tắt
        // 3. KHÔNG ĐANG TÔ (isPainting = false) <--- QUAN TRỌNG
        if (this.finishedParts.size < this.totalParts && !this.isIntroActive && !isPainting) {
            this.idleTimer += delta;

            if (this.idleTimer > this.IDLE_THRESHOLD && !this.activeHintTween) {
                this.showHint();
            }
        } else {
            // Nếu đang tô thì luôn giữ đồng hồ ở số 0
            this.idleTimer = 0;
        }
    }

    private resetIdleTimer() {
        this.idleTimer = 0;

        // 1. Tắt hiệu ứng nhấp nháy (Vật thể)
        if (this.activeHintTween) {
            this.activeHintTween.stop();
            this.activeHintTween = null;
            
            this.unfinishedPartsMap.forEach(img => {
                this.tweens.killTweensOf(img);
                img.setAlpha(0.01);
                // Trả về scale gốc
                const s = img.getData('originScale');
                if (s) img.setScale(s);
            });
        }

        // 2. Tắt bàn tay (Nếu đang dùng để gợi ý)
        // (Chỉ tắt khi Intro đã xong để tránh xung đột)
        if (!this.isIntroActive && this.handHint) {
            this.tweens.killTweensOf(this.handHint);
            this.handHint.setAlpha(0);
            this.handHint.setPosition(-200, -200);
        }
    }

    private showHint() {
        // Lấy danh sách chưa tô
        const keys = Array.from(this.unfinishedPartsMap.keys());
        if (keys.length === 0) return;

        // Chọn ngẫu nhiên 1 phần
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const targetImage = this.unfinishedPartsMap.get(randomKey);

        if (!targetImage || !this.handHint) return;

        // A. VOICE: Nhắc nhở
        AudioManager.play('hint'); 

        // B. VISUAL 1: Vật thể nhấp nháy
        this.activeHintTween = this.tweens.add({
            targets: targetImage,
            alpha: { from: 0.01, to: 0.6 },
            scale: { 
                from: targetImage.getData('originScale'), 
                to: targetImage.getData('originScale') * 1.05 
            },
            duration: 800,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.activeHintTween = null;
                this.idleTimer = 0; // Reset để chờ lần sau
            }
        });

        // C. VISUAL 2: Bàn tay chỉ vào
        // 1. Lấy độ lệch (Offset) từ Data
        const offsetX = targetImage.getData('hintX') || 0;
        const offsetY = targetImage.getData('hintY') || 0;

        // 2. Lấy scale hiện tại
        const currentScale = targetImage.scaleX;

        // 3. Tính vị trí chính xác
        const handX = targetImage.x + (offsetX * currentScale);
        const handY = targetImage.y + (offsetY * currentScale);

        this.handHint.setPosition(handX + 50, handY + 50); // Xuất phát xa xa
        this.handHint.setAlpha(0);
        this.handHint.setScale(0.7);

        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: handX, y: handY, duration: 500, ease: 'Power2' }, // Hiện ra
                { scale: 0.5, duration: 400, yoyo: true, repeat: 3 }, // Ấn ấn 4 cái
                { alpha: 0, duration: 500, onComplete: () => this.handHint.setPosition(-200, -200) } // Biến mất
            ]
        });
    }
}