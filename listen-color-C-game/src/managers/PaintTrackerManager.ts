import { game } from "@iruka-edu/mini-game-sdk";
import { GameConstants } from '../consts/GameConstants';

interface ShapeTrackerState {
    tracker: any;
    expectedRegions: any[];
    accumulatedRegionsResult: any[];
    finishedRegions: Set<string>;
    totalParts: number;
    lastReportedCoveragePerRegion: Map<string, number>;
    lastReportedMatchPxPerRegion: Map<string, number>;
    lastReportedSpillPxPerRegion: Map<string, number>;
    lastReportedAreaPxPerRegion: Map<string, number>;
    lastUsedColorPerRegion: Map<string, string>;
    pendingNewAttempt: boolean; // Co: can goi onShown() truoc khi onDone() tiep theo
    hasShown: boolean;
}

export class PaintTrackerManager {
    private runSeq = 1;
    private nextItemSeq = 0;

    private shapeStates = new Map<string, ShapeTrackerState>();
    private paintManager?: any;
    /** Đếm số lần hint đã hiển thị cho mỗi shapeId */
    private hintCountPerShape = new Map<string, number>();
    /** Ngưỡng hint để gán HINT_RELIANCE */
    private static readonly HINT_RELIANCE_THRESHOLD = 5;

    constructor(_scene: Phaser.Scene) {
        this.reset();
    }

    setPaintManager(pm: any) {
        this.paintManager = pm;
    }

    reset() {
        const state = (window as any).irukaGameState || {};
        this.runSeq = state.runSeq || 1;

        this.nextItemSeq = 0;
        this.shapeStates.clear();
        this.hintCountPerShape.clear();
    }

    finalizeAll(isReset: boolean = false) {
        // Duyệt qua tất cả shapes, nhưng chỉ xử lý 1 lần mỗi state
        // (nhiều partId có thể chia sẻ cùng 1 state)
        const processedStates = new Set<ShapeTrackerState>();

        this.shapeStates.forEach((state, _partId) => {
            if (!state.tracker || processedStates.has(state)) return;
            processedStates.add(state);

            const shapeId = (state as any)._shapeId || _partId;
            const isDone = state.finishedRegions.size >= state.totalParts;

            if (isDone) {
                // Shape đã hoàn thành → chỉ finalize, KHÔNG onQuit
                console.log(`[PaintTracker] finalizeAll: ${shapeId} DONE → finalize only`);
                state.tracker.finalize();
            } else if (isReset) {
                // Nếu là RESET mà chưa xong, chúng ta HỦY LUÔN item này, không finalize.
                // Việc không finalize sẽ khiến item này biến mất hoàn toàn khỏi JSON gửi về SDK.
                console.log(`[PaintTracker] finalizeAll: ${shapeId} RESET & Incomplete → Discarding item to avoid Fail/Abandoned log`);
            } else if (!state.pendingNewAttempt) {
                // Shape chưa xong VÀ có open attempt (onShown đã gọi, onDone chưa gọi)
                // VÀ không phải Reset -> Đây là USER_ABANDONED thực sự
                console.log(`[PaintTracker] finalizeAll: ${shapeId} ABANDONED (open attempt) → onQuit + finalize`);
                state.tracker.onQuit(Date.now());
                state.tracker.finalize();
            } else {
                // Shape chưa xong NHƯNG không có open attempt (vd: sau khi tẩy)
                console.log(`[PaintTracker] finalizeAll: ${shapeId} incomplete but no open attempt → finalize`);
                state.tracker.finalize();
            }

            state.tracker = null;
        });

        this.shapeStates.clear();
    }

    initShapeTrackers(partsMap: Map<string, Phaser.GameObjects.Image>) {
        this.reset();

        // Group parts by shapeId
        const groups = new Map<string, { partId: string, hitArea: Phaser.GameObjects.Image }[]>();
        partsMap.forEach((hitArea, partId) => {
            const shapeId = hitArea.getData('shapeId') || 'shape_1';
            if (!groups.has(shapeId)) groups.set(shapeId, []);
            groups.get(shapeId)!.push({ partId, hitArea });
        });

        // Initialize one tracker per group (Shape/Object)
        groups.forEach((parts, shapeId) => {
            this.initGroupedTracker(shapeId, parts);
        });
    }

    private initGroupedTracker(shapeId: string, parts: { partId: string, hitArea: Phaser.GameObjects.Image }[]) {
        const seq = ++this.nextItemSeq;
        const state: ShapeTrackerState = {
            tracker: null,
            expectedRegions: [],
            accumulatedRegionsResult: [],
            finishedRegions: new Set(),
            totalParts: parts.length,
            lastReportedCoveragePerRegion: new Map(),
            lastReportedMatchPxPerRegion: new Map(),
            lastReportedSpillPxPerRegion: new Map(),
            lastReportedAreaPxPerRegion: new Map(),
            lastUsedColorPerRegion: new Map(),
            pendingNewAttempt: false,
            hasShown: false,
        };
        (state as any)._shapeId = shapeId; // lưu shapeId để recordHint tra cứu

        const firstPart = parts[0].hitArea;
        const minCov = firstPart.getData("min_region_coverage") ?? GameConstants.PAINT.WIN_PERCENT;
        const maxSpill = firstPart.getData("max_spill_ratio") ?? 0;
        const itemTypeOverride = firstPart.getData("itemTypeOverride") || 'paint';
        // Đọc item_label từ JSON (đã được LevelLoader set vào hitArea)
        // Nếu có nhiều parts trong 1 shape, dùng label từ part đầu tiên
        const itemLabel: string | undefined = firstPart.getData("itemLabel") || undefined;

        parts.forEach(p => {
            let areaPx = p.hitArea.getData("area_px");
            const key = p.hitArea.getData("partKey");
            if ((!areaPx || areaPx === 0) && this.paintManager && key) {
                areaPx = this.paintManager.preCalculateArea(key);
                p.hitArea.setData("area_px", areaPx);
            }
            areaPx = areaPx || 1;

            const allowedColorsRaw = p.hitArea.getData("allowed_colors") ?? ["any"];
            const ALL_COLORS = ["0xff595e", "0xffca3a", "0x8ac926", "0x1982c4", "0x6a4c93", "0xfdfcdc", "0x000000"];
            const finalAllowedColors = (allowedColorsRaw.length === 1 && allowedColorsRaw[0] === "any") ? ALL_COLORS : allowedColorsRaw;

            const correctColor = p.hitArea.getData("correct_color");
            const note = p.hitArea.getData("partNote");
            const regionId = note || p.partId;

            const regionConfig: any = {
                id: regionId,
                key: key,
                allowed_colors: finalAllowedColors,
                correct_color: correctColor ?? null
            };

            state.expectedRegions.push(regionConfig);
        });

        const itemType = itemTypeOverride; // 'paint-shape' hoặc 'paint-char' từ LevelLoader

        const finalItemId = shapeId;

        state.tracker = game.createPaintTracker({
            meta: {
                item_id: finalItemId,
                item_type: itemType as any,
                item_label: itemLabel,
                seq,
                run_seq: this.runSeq,
                difficulty: 1,
                scene_id: "SCN_PAINT_01",
                scene_seq: seq,
                scene_type: "paint",
                skill_ids: [],
            } as any,
            expected: {
                item_id_override: finalItemId,
                item_type_override: itemTypeOverride,
                regions: state.expectedRegions,
                min_region_coverage: minCov,
                max_spill_ratio: maxSpill,
            } as any,
        });

        // Removed eager onShown: state.tracker.onShown(Date.now());

        // Map each partId to this state so recordAttempt can find it
        parts.forEach(p => {
            this.shapeStates.set(p.partId, state);
        });
    }

    getTracker(partId: string) {
        return this.shapeStates.get(partId)?.tracker;
    }

    /**
     * Ghi nhận 1 lần hint đã được hiển thị cho partId.
     * Trả về tổng số lần hint đã dùng cho shape đó.
     */
    recordHint(partId: string): number {
        const state = this.shapeStates.get(partId);
        if (!state) return 0;

        // Tìm shapeId thực để group các part cùng shape
        const shapeId = this._getShapeIdForPart(partId);
        const current = this.hintCountPerShape.get(shapeId) || 0;
        const next = current + 1;
        this.hintCountPerShape.set(shapeId, next);
        console.log(`[PaintTracker] Hint #${next} cho shape: ${shapeId} (part: ${partId})`);
        return next;
    }

    private _getShapeIdForPart(partId: string): string {
        // Tìm trong các entry để lấy shapeId tương ứng
        // (nhiều partId có thể map về cùng 1 shapeState)
        for (const [pid, state] of this.shapeStates.entries()) {
            if (pid === partId) {
                // Tìm shapeId từ expectedRegions[0].id hoặc fallback về partId
                return (state as any)._shapeId || partId;
            }
        }
        return partId;
    }

    recordAttempt(id: string, hitArea: Phaser.GameObjects.Image, coverage: number, totalPx: number, matchPx: number, usedColors: Set<number>, spillPx: number = 0, trueLastColor?: number) {
        const state = this.shapeStates.get(id);

        if (!state || !state.tracker) return false;

        const brushSize = GameConstants.PAINT.BRUSH_SIZE;
        // ✅ FIX: Dùng trueLastColor (màu cuối thực sự) thay vì phần tử cuối Set
        // Set không re-insert → đỏ→vàng→đỏ sẽ vẫn lấy vàng nếu dùng Set
        const colorArr = Array.from(usedColors);
        const selectedColor = trueLastColor != null
            ? this.toHex(trueLastColor)
            : (colorArr.length > 0 ? this.toHex(colorArr[colorArr.length - 1]) : "multi");
        const minCov = hitArea.getData("min_region_coverage") ?? GameConstants.PAINT.WIN_PERCENT;
        const isCorrect = coverage >= minCov;
        const spillRatio = 0; // Hardcode theo yêu cầu

        // Luot choi moi ke ca sau khi da ve dung (de ghi nhan them Attempt va Color Change)
        // if (state.finishedRegions.has(id)) { return true; }

        // Neu game vua moi load chua touch bao gio thi ban onShown lan dau
        if (!state.hasShown) {
            state.tracker.onShown(Date.now());
            state.hasShown = true;
        }

        // Neu co pending attempt moi (sau lan ve truoc), mo attempt moi truoc khi ghi data
        if (state.pendingNewAttempt) {
            state.tracker.onShown(Date.now());
            state.pendingNewAttempt = false;
        }

        // Khai báo regionId sớm để dùng trong cả erase block lẫn normal block
        const note = hitArea.getData("partNote");
        const regionId = note || id;

        // --- Calculate Deltas for this Stroke/Attempt ---
        const lastCoverage = state.lastReportedCoveragePerRegion.get(id) || 0;
        const lastMatchPx = state.lastReportedMatchPxPerRegion.get(id) || 0;
        const lastAreaPx = state.lastReportedAreaPxPerRegion.get(id) || 0;

        // Fix cứng diện tích tổng: Lấy từ hitArea đã tính sẵn thay vì snapshot biến đổi
        const totalPxFixed = hitArea.getData("area_px") || totalPx;

        // --- Phát hiện khi người dùng TẨY MÀU: coverage giảm so với lần trước ---
        const ERASE_THRESHOLD = 0.05; // Coverage giảm hơn 5% → coi là erase
        if (lastCoverage > 0 && coverage < lastCoverage - ERASE_THRESHOLD) {
            console.log(`[PaintTracker] Phat hien ERASE tren ${id}: ${lastCoverage.toFixed(3)} -> ${coverage.toFixed(3)}. Chi reset state, KHONG gui len SDK.`);

            // Chi reset state noi bo — KHONG goi onDone/onShown
            // Attempt hien tai van con "mo", lan to mau tiep theo se ghi vao chinh attempt nay
            // => Khong co Attempt USER_ERASED xuat hien trong history
            state.lastReportedCoveragePerRegion.set(id, coverage);
            state.lastReportedMatchPxPerRegion.set(id, matchPx);
            state.lastReportedSpillPxPerRegion.set(id, spillPx);
            state.lastReportedAreaPxPerRegion.set(id, totalPxFixed);

            // Giữ lại trí nhớ về màu cũ để nếu user chọn màu khác tô lên thì vẫn tính là đổi màu
            // state.lastUsedColorPerRegion.delete(id); 

            return false;
        }

        const deltaCoverage = Math.max(0, coverage - lastCoverage);
        const deltaMatchPx = Math.max(0, matchPx - lastMatchPx);
        // const deltaSpillPx = Math.max(0, spillPx - lastSpillPx);
        const deltaSpillPx = 0;
        const deltaAreaPx = Math.max(0, totalPxFixed - lastAreaPx);

        // Update last reported values
        state.lastReportedCoveragePerRegion.set(id, coverage);
        state.lastReportedMatchPxPerRegion.set(id, matchPx);
        state.lastReportedSpillPxPerRegion.set(id, spillPx);
        state.lastReportedAreaPxPerRegion.set(id, totalPxFixed);


        // Vẫn lưu Total vào biến để cập nhật biến tracking tổng
        const regionResultTotal = {
            region_id: regionId,
            area_px: totalPxFixed,
            paint_in_px: matchPx,
            paint_out_px: spillPx,
            coverage: coverage,
            spill_ratio: spillRatio,
            selected_color: selectedColor,
        };

        if (isCorrect) {
            state.finishedRegions.add(id);
        }

        // Cập nhật mảng cộng dồn tạm thời (lưu Total của các vùng)
        const existingIndex = state.accumulatedRegionsResult.findIndex((r: any) => r.region_id === regionId);
        if (existingIndex >= 0) {
            state.accumulatedRegionsResult[existingIndex] = regionResultTotal;
        } else {
            state.accumulatedRegionsResult.push(regionResultTotal);
        }

        // --- Calculate Color Change Delta (Consecutive Tracking) ---
        // Đếm dựa trên việc người dùng có đổi sang màu khác với màu vừa tô nét trước hay không.
        const prevColorStr = state.lastUsedColorPerRegion.get(id);
        const colorChangeDelta = (prevColorStr && prevColorStr !== selectedColor) ? 1 : 0;
        state.lastUsedColorPerRegion.set(id, selectedColor);

        // --- Báo cáo lên SDK phần DELTA (chênh lệch của nét cọ vừa vẽ) ---
        const deltaSpillRatio = 0; // Hardcode theo yêu cầu
        const regionResultDelta = {
            region_id: regionId,
            area_px: deltaAreaPx,
            paint_in_px: deltaMatchPx,
            paint_out_px: deltaSpillPx,
            coverage: deltaCoverage,
            spill_ratio: deltaSpillRatio,
            selected_color: selectedColor,
        };

        // --- Xác định errorCode ---
        // HINT_RELIANCE: hint đã được dùng >= ngưỡng cho shape này
        const shapeId = (state as any)._shapeId || id;
        const hintCount = this.hintCountPerShape.get(shapeId) || 0;
        const errorCode = hintCount > PaintTrackerManager.HINT_RELIANCE_THRESHOLD
            ? 'HINT_RELIANCE'
            : null;

        if (errorCode) {
            console.log(`[PaintTracker] HINT_RELIANCE: hint x${hintCount} cho ${shapeId}`);
        }

        // Gửi Delta báo cáo lên cho attempt này
        state.tracker.onDone({
            selected_color: selectedColor,
            brush_size: brushSize,
            color_change_count: colorChangeDelta,
            brush_change_count: 0,
            regions_result: [regionResultDelta],
            total_paint_in_px: deltaMatchPx,
            total_paint_out_px: deltaSpillPx,
            completion_pct: deltaCoverage,
            spill_ratio: deltaSpillRatio,
        }, Date.now(), {
            isCorrect: true,
            errorCode,
        });

        // Khong goi onShown() ngay — dat co "pendingNewAttempt"
        // onShown se chi duoc goi neu nguoi dung thuc su to lai (tranh attempt rong -> USER_ABANDONED)
        state.pendingNewAttempt = true;
        console.log(`[PaintTracker] onDone xong. Dat co pendingNewAttempt=true.`);

        return isCorrect;
    }

    private toHex(color: number): string {
        return `0x${color.toString(16).padStart(6, '0')}`;
    }
}
