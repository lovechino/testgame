import Phaser from 'phaser';

import { SceneKeys, TextureKeys, DataKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants';
import { GameUtils } from '../utils/GameUtils';
import { IdleManager } from '../utils/IdleManager';
import { PaintManager } from '../utils/PaintManager';
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation';
import AudioManager from '../audio/AudioManager';
import { createFPSCounter } from '../utils/DebugUtils';

export default class Scene2 extends Phaser.Scene {

    // --- QUẢN LÝ LOGIC (MANAGERS) ---
    private paintManager!: PaintManager; // Quản lý việc tô màu, cọ vẽ, canvas
    private idleManager!: IdleManager;   // Quản lý thời gian rảnh để hiện gợi ý

    // --- QUẢN LÝ TRẠNG THÁI GAME (GAME STATE) ---
    // Map lưu các bộ phận chưa tô xong (Key: ID, Value: Image Object) -> Dùng để random gợi ý
    private unfinishedPartsMap: Map<string, Phaser.GameObjects.Image> = new Map();
    // Set lưu ID các bộ phận đã hoàn thành -> Dùng để check thắng (Win condition)
    private finishedParts: Set<string> = new Set();
    private totalParts: number = 0;      // Tổng số bộ phận cần tô
    private isIntroActive: boolean = false; // Cờ chặn tương tác khi đang chạy intro

    // --- UI COMPONENTS ---
    private paletteButtons: Phaser.GameObjects.Image[] = []; // Danh sách nút màu
    private handHint!: Phaser.GameObjects.Image;             // Bàn tay gợi ý
    private firstColorBtn!: Phaser.GameObjects.Image;        // Nút màu đầu tiên (dùng cho Tutorial)

    // Tween đang chạy cho gợi ý (lưu lại để stop khi cần)
    private activeHintTween: Phaser.Tweens.Tween | null = null;

    // --- CẤU HÌNH MÀU SẮC (CONFIG) ---
    private readonly PALETTE_DATA = [
        { key: TextureKeys.BtnRed, color: 0xFF595E },
        { key: TextureKeys.BtnYellow, color: 0xFFCA3A },
        { key: TextureKeys.BtnGreen, color: 0x8AC926 },
        { key: TextureKeys.BtnBlue, color: 0x1982C4 },
        { key: TextureKeys.BtnPurple, color: 0x6A4C93 },
        { key: TextureKeys.BtnCream, color: 0xFDFCDC },
        { key: TextureKeys.BtnBlack, color: 0x000000 }
    ];

    constructor() { super(SceneKeys.Scene2); }

    /**
     * Khởi tạo lại dữ liệu khi Scene bắt đầu (hoặc Restart)
     * QUAN TRỌNG: Phải clear các Map/Set để tránh lỗi "Zombie Object" (tham chiếu đến object cũ đã bị destroy)
     */
    init() {
        this.unfinishedPartsMap.clear();
        this.finishedParts.clear();
        this.totalParts = 0;
        this.paletteButtons = [];
    }

    create() {
        this.setupSystem();       // Cài đặt hệ thống (Paint, Idle)
        this.createUI();          // Tạo giao diện (Bảng màu, Banner)
        this.createLevel();       // Tạo nhân vật và các vùng tô màu

        this.setupInput();        // Cài đặt sự kiện chạm/vuốt
        this.playIntroSequence(); // Chạy hướng dẫn đầu game
        createFPSCounter(this);   // Tạo FPS Counter

        // Sự kiện khi quay lại tab game (Wake up)
        this.events.on('wake', () => {
            this.idleManager.reset();
            if (this.input.keyboard) this.input.keyboard.enabled = true;
        });
    }

    update(time: number, delta: number) {
        if (!this.paintManager.isPainting() && !this.isIntroActive && this.finishedParts.size < this.totalParts) {
            this.idleManager.update(delta);
        }
    }

    shutdown() {
        this.stopIntro();
        this.paintManager = null as any; // Giải phóng bộ nhớ
    }

    // =================================================================
    // PHẦN 1: CÀI ĐẶT HỆ THỐNG (SYSTEM SETUP)
    // =================================================================

    private setupSystem() {
        resetVoiceState();
        (window as any).gameScene = this;
        setGameSceneReference(this);

        // Khởi tạo PaintManager
        // Callback nhận về: id, renderTexture, và DANH SÁCH MÀU ĐÃ DÙNG (Set<number>)
        this.paintManager = new PaintManager(this, (id, rt, usedColors) => {
            this.handlePartComplete(id, rt, usedColors);
        });

        // Mặc định chọn màu đầu tiên
        this.paintManager.setColor(this.PALETTE_DATA[0].color);

        // Cài đặt Idle Manager: Khi rảnh quá lâu thì gọi showHint()
        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => this.showHint());
    }

    private setupInput() {
        // Chuyển tiếp các sự kiện input sang cho PaintManager xử lý vẽ
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.paintManager.handlePointerMove(p));
        this.input.on('pointerup', () => this.paintManager.handlePointerUp());

        // Khi chạm vào màn hình -> Reset bộ đếm Idle
        this.input.on('pointerdown', () => {
            this.idleManager.reset();
            this.stopIntro();
        });
    }

    // =================================================================
    // PHẦN 2: TẠO GIAO DIỆN & LEVEL (UI & LEVEL CREATION)
    // =================================================================

    private createUI() {
        const UI = GameConstants.SCENE2.UI;
        const cx = GameUtils.pctX(this, 0.5);

        const bannerY = GameUtils.pctY(this, UI.BANNER_Y);
        const banner = this.add.image(cx, bannerY, TextureKeys.S2_Banner).setOrigin(0.5, 0).setScale(0.7);

        const textY = bannerY + banner.displayHeight / 2;
        this.add.image(cx, textY, TextureKeys.S2_TextBanner).setScale(0.7);

        // --- CẤU HÌNH BẢNG ---
        const boardY = banner.displayHeight + GameUtils.pctY(this, UI.BOARD_OFFSET);

        this.add.image(cx, boardY, TextureKeys.S2_Board)
            .setOrigin(0.5, 0) // Neo ở cạnh trên
            .setScale(1, 0.7)
            .displayWidth = GameUtils.getW(this) * 0.95; // Rộng 95% màn hình (đủ chỗ chứa nút)

        // Truyền boardY vào để tính toán vị trí nút màu
        this.createPalette(boardY);

        // Tạo tên item
        this.add.image(GameUtils.pctX(this, GameConstants.SCENE2.UI.NAME_X), GameUtils.pctY(this, GameConstants.SCENE2.UI.NAME_Y), TextureKeys.S2_Text_Item);

        // Tạo bàn tay gợi ý
        this.handHint = this.add.image(0, 0, TextureKeys.HandHint).setDepth(200).setAlpha(0).setScale(0.7);
    }

    // Thêm tham số boardStartY
    private createPalette(boardStartY: number) {
        const xPos = GameUtils.pctX(this, 0.91);
        const startY = boardStartY + GameUtils.pctY(this, 0.06);
        const spacing = GameUtils.pctY(this, 0.1);

        this.PALETTE_DATA.forEach((item, i) => {
            const btnX = xPos;
            const btnY = startY + (i * spacing);

            const btn = this.add.image(btnX, btnY, item.key).setInteractive();

            // Logic visual: Nút đầu tiên to hơn
            if (i === 0) {
                this.firstColorBtn = btn;
                btn.setScale(0.65).setAlpha(1);
            } else {
                btn.setAlpha(0.85).setScale(0.55);
            }

            btn.on('pointerdown', () => {
                this.updatePaletteVisuals(btn);
                this.paintManager.setColor(item.color);
            });
            this.paletteButtons.push(btn);
        });

        // --- TẠO NÚT TẨY (ERASER) ---
        // Nằm kế tiếp ở dưới cùng hàng dọc
        const eraserX = xPos;
        const eraserY = startY + (this.PALETTE_DATA.length * spacing);


        const eraser = this.add.image(eraserX, eraserY, TextureKeys.BtnEraser)
            .setInteractive()
            .setAlpha(0.85)
            .setScale(0.55);

        eraser.on('pointerdown', () => {
            this.updatePaletteVisuals(eraser);
            this.paintManager.setEraser();
        });
        this.paletteButtons.push(eraser);
    }

    private updatePaletteVisuals(activeBtn: Phaser.GameObjects.Image) {
        // Các nút không chọn: Nhỏ và mờ nhẹ
        this.paletteButtons.forEach(b => b.setScale(0.55).setAlpha(0.85));

        // Nút đang chọn: To hơn và rõ
        activeBtn.setScale(0.65).setAlpha(1);
    }

    private createLevel() {
        // Load cấu hình level từ JSON
        const data = this.cache.json.get(DataKeys.LevelS2Config);
        if (data) {
            this.spawnCharacter(data.item);
            this.spawnCharacter(data.letter);
        }
    }

    private spawnCharacter(config: any) {
        const cx = GameUtils.pctX(this, config.baseX_pct);
        const cy = GameUtils.pctY(this, config.baseY_pct);

        // Quy định Depth cơ bản: Item (Búp bê) nằm dưới (10), Letter (Chữ) nằm trên (30)
        const baseDepth = config.outlineKey === 'item_outline' ? 10 : 30;

        config.parts.forEach((part: any, index: number) => {
            const id = `${part.frame}_${index}`; // Đổi ID theo tên frame cho dễ debug
            const layerX = cx + part.offsetX;
            const layerY = cy + part.offsetY;

            // 🔥 TÍNH TOÁN DEPTH: Đảm bảo bộ phận sau đè lên bộ phận trước
            const partDepth = baseDepth + index;

            // Tạo vùng tô màu thông qua PaintManager
            const hitArea = this.paintManager.createPaintableLayer(
                layerX,
                layerY,
                part.key,   // 's2_parts'
                part.frame, // 'doll_1'
                part.scale,
                id,
                partDepth
            );
            // --- BEST PRACTICE: LƯU DỮ LIỆU TĨNH ---
            // Lưu các thông số cấu hình vào Data Manager của Game Object.
            // Điều này cực kỳ quan trọng để sửa lỗi lệch vị trí khi lag/tween.
            hitArea.setData('hintX', part.hintX || 0);
            hitArea.setData('hintY', part.hintY || 0);
            hitArea.setData('originScale', part.scale); // Scale gốc (không đổi)

            this.unfinishedPartsMap.set(id, hitArea);
            this.totalParts++;
        });

        // Vẽ viền (Outline) lên trên cùng
        this.add.image(cx, cy, config.outlineKey).setScale(config.baseScale).setDepth(100);
    }

    // =================================================================
    // PHẦN 3: LOGIC GAMEPLAY (GAMEPLAY LOGIC)
    // =================================================================

    /**
     * Xử lý khi một bộ phận được tô xong
     * @param usedColors Set chứa danh sách các màu đã tô lên bộ phận này
     */
    private handlePartComplete(id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) {
        this.finishedParts.add(id);

        // --- LOGIC AUTO-FILL THÔNG MINH ---
        // Nếu bé chỉ dùng ĐÚNG 1 MÀU -> Game tự động fill màu đó cho đẹp (khen thưởng)
        if (usedColors.size === 1) {
            // FIX TYPESCRIPT: Thêm '|| 0' để đảm bảo không bị lỗi undefined
            const singleColor = usedColors.values().next().value || 0;

            rt.setBlendMode(Phaser.BlendModes.NORMAL);
            rt.fill(singleColor);
        } else {
            // Nếu bé dùng >= 2 màu (tô sặc sỡ) -> Giữ nguyên nét vẽ nghệ thuật của bé
            console.log("Multi-color artwork preserved!");
        }

        // Xóa khỏi danh sách chưa tô -> Để gợi ý không chỉ vào cái này nữa
        this.unfinishedPartsMap.delete(id);

        AudioManager.play('sfx-ting');

        // Hiệu ứng nhấp nháy báo hiệu hoàn thành
        this.tweens.add({ targets: rt, alpha: 0.8, yoyo: true, duration: GameConstants.SCENE2.TIMING.AUTO_FILL, repeat: 2 });

        // Kiểm tra điều kiện thắng
        if (this.finishedParts.size >= this.totalParts) {
            console.log("WIN!");
            AudioManager.play('sfx-correct_s2');
            this.time.delayedCall(GameConstants.SCENE2.TIMING.WIN_DELAY, () => this.scene.start(SceneKeys.EndGame));
        }
    }

    // =================================================================
    // PHẦN 4: HƯỚNG DẪN & GỢI Ý (TUTORIAL & HINT)
    // =================================================================

    public restartIntro() {
        this.stopIntro();
        this.time.delayedCall(GameConstants.SCENE2.TIMING.RESTART_INTRO, () => this.playIntroSequence());
    }

    private playIntroSequence() {
        this.isIntroActive = true;
        playVoiceLocked(null, 'voice_intro_s2');
        // Đợi 1 chút rồi chạy animation tay hướng dẫn
        this.time.delayedCall(GameConstants.SCENE2.TIMING.INTRO_DELAY, () => { if (this.isIntroActive) this.runHandTutorial(); });
    }

    private stopIntro() {
        this.isIntroActive = false;
        this.idleManager.start();
        this.tweens.killTweensOf(this.handHint);
        this.handHint.setAlpha(0).setPosition(-200, -200);
    }

    /**
     * Tutorial đầu game: Tay cầm màu đỏ tô mẫu
     */
    private runHandTutorial() {
        if (!this.firstColorBtn || !this.isIntroActive) return;

        const UI = GameConstants.SCENE2.UI;
        const INTRO = GameConstants.SCENE2.INTRO_HAND;

        // Tính toán tọa độ
        const startX = this.firstColorBtn.x + 20;
        const startY = this.firstColorBtn.y + 20;
        const endX = GameUtils.pctX(this, UI.HAND_INTRO_END_X);
        const endY = GameUtils.pctY(this, UI.HAND_INTRO_END_Y);
        const dragY = endY + 100;

        this.handHint.setPosition(startX, startY).setAlpha(0).setScale(0.7);

        // Chuỗi Animation: Hiện -> Ấn chọn màu -> Kéo ra -> Di đi di lại (tô) -> Biến mất
        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: startX, y: startY, duration: INTRO.MOVE, ease: 'Power2' },
                { scale: 0.5, duration: INTRO.TAP, yoyo: true, repeat: 0.7 },
                { x: endX, y: dragY, duration: INTRO.DRAG, delay: 100 },
                { x: '-=30', y: '-=10', duration: INTRO.RUB, yoyo: true, repeat: 3 },
                {
                    alpha: 0, duration: 500, onComplete: () => {
                        this.handHint.setPosition(-200, -200);
                        // Lặp lại nếu Intro chưa kết thúc
                        if (this.isIntroActive) this.time.delayedCall(1000, () => this.runHandTutorial());
                    }
                }
            ]
        });
    }

    /**
     * Gợi ý khi rảnh (Idle Hint): Chọn ngẫu nhiên 1 phần chưa tô để chỉ vào
     */
    private showHint() {
        const items = Array.from(this.unfinishedPartsMap.values());
        if (items.length === 0) return;

        // Random 1 bộ phận
        const target = items[Math.floor(Math.random() * items.length)];

        AudioManager.play('hint');

        const IDLE_CFG = GameConstants.IDLE;

        // Visual 1: Nhấp nháy bộ phận đó
        this.activeHintTween = this.tweens.add({
            targets: target, alpha: { from: 0.01, to: 0.8 },
            scale: { from: target.getData('originScale'), to: target.getData('originScale') * 1.005 },
            duration: IDLE_CFG.FADE_IN, yoyo: true, repeat: 2,
            onComplete: () => { this.activeHintTween = null; this.idleManager.reset(); }
        });

        // Visual 2: Bàn tay chỉ vào
        // --- FIX BUG LỆCH VỊ TRÍ (BEST PRACTICE) ---
        // Không dùng target.scaleX vì nó biến thiên khi tween.
        // Dùng originScale (lấy từ Data) để đảm bảo tính toán vị trí luôn chính xác tuyệt đối.
        const hX = target.getData('hintX') || 0;
        const hY = target.getData('hintY') || 0;
        const originScale = target.getData('originScale') || 1;

        // Tính tọa độ đích dựa trên scale gốc
        const destX = target.x + (hX * originScale);
        const destY = target.y + (hY * originScale);

        this.handHint.setPosition(destX + IDLE_CFG.OFFSET_X, destY + IDLE_CFG.OFFSET_Y).setAlpha(0).setScale(0.7);

        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: destX, y: destY, duration: IDLE_CFG.FADE_IN },
                { scale: 0.5, duration: IDLE_CFG.SCALE, yoyo: true, repeat: 3 },
                { alpha: 0, duration: IDLE_CFG.FADE_OUT }
            ]
        });
    }
}