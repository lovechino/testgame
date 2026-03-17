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
                state.tracker.finalize();
            } else if (isReset) {
                // Nếu là RESET mà chưa xong, chúng ta HỦY LUÔN item này, không finalize.
                // Việc không finalize sẽ khiến item này biến mất hoàn toàn khỏi JSON gửi về SDK.
            } else if (!state.pendingNewAttempt) {
                // Shape chưa xong VÀ có open attempt (onShown đã gọi, onDone chưa gọi)
                // VÀ không phải Reset -> Đây là USER_ABANDONED thực sự
                state.tracker.onQuit(Date.now());
                state.tracker.finalize();
            } else {
                // Shape chưa xong NHƯNG không có open attempt (vd: sau khi tẩy)
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
        const state = this.createInitialState(parts.length, shapeId);
        const header = parts[0].hitArea;
        
        parts.forEach(p => {
            const regionConfig = this.createRegionConfig(p.partId, p.hitArea);
            state.expectedRegions.push(regionConfig);
        });

        const itemType = header.getData("itemTypeOverride") || 'paint';
        state.tracker = this.createSDKTracker(shapeId, itemType, header.getData("itemLabel"), seq, state.expectedRegions, header);

        parts.forEach(p => this.shapeStates.set(p.partId, state));
    }

    private createInitialState(total: number, shapeId: string): ShapeTrackerState {
        return {
            tracker: null, expectedRegions: [], accumulatedRegionsResult: [],
            finishedRegions: new Set(), totalParts: total,
            lastReportedCoveragePerRegion: new Map(), lastReportedMatchPxPerRegion: new Map(),
            lastReportedSpillPxPerRegion: new Map(), lastReportedAreaPxPerRegion: new Map(),
            lastUsedColorPerRegion: new Map(), pendingNewAttempt: false, hasShown: false,
            _shapeId: shapeId
        } as any;
    }

    private createRegionConfig(partId: string, hitArea: Phaser.GameObjects.Image) {
        let areaPx = hitArea.getData("area_px");
        if ((!areaPx || areaPx === 0) && this.paintManager) {
            areaPx = this.paintManager.preCalculateArea(hitArea.getData("partKey"));
            hitArea.setData("area_px", areaPx);
        }

        const allowedRaw = hitArea.getData("allowed_colors") ?? ["any"];
        const ALL = ["0xff595e", "0xffca3a", "0x8ac926", "0x1982c4", "0x6a4c93", "0xfdfcdc", "0x000000"];
        const colors = (allowedRaw.length === 1 && allowedRaw[0] === "any") ? ALL : allowedRaw;

        return {
            id: hitArea.getData("partNote") || partId,
            key: hitArea.getData("partKey"),
            allowed_colors: colors,
            correct_color: hitArea.getData("correct_color") ?? null
        };
    }

    private createSDKTracker(id: string, type: string, label: string | undefined, seq: number, regions: any[], hitArea: Phaser.GameObjects.Image) {
        return game.createPaintTracker({
            meta: {
                item_id: id, item_type: type as any, item_label: label,
                seq, run_seq: this.runSeq, difficulty: 1,
                scene_id: "SCN_PAINT_01", scene_seq: seq, scene_type: "paint", skill_ids: [],
            } as any,
            expected: {
                item_id_override: id, item_type_override: type,
                regions,
                min_region_coverage: hitArea.getData("min_region_coverage") ?? GameConstants.PAINT.WIN_PERCENT,
                max_spill_ratio: hitArea.getData("max_spill_ratio") ?? 0,
            } as any,
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

    recordAttempt(id: string, hit: Phaser.GameObjects.Image, coverage: number, match: number, colors: Set<number>, spill: number = 0, trueColor?: number) {
        const state = this.shapeStates.get(id);
        if (!state || !state.tracker) return false;

        this.ensureAttemptOpen(state);

        const lastCov = state.lastReportedCoveragePerRegion.get(id) || 0;
        if (this.checkErase(state, id, coverage, lastCov, match, spill, hit)) return false;

        const selectedColor = this.getStrokeColor(colors, trueColor);
        const { delta, colorChange } = this.calculateDeltas(state, id, coverage, match, spill, hit, selectedColor);
        this.updateAccumulated(state, delta);

        state.tracker.onDone(this.createAttemptData(selectedColor, delta, colorChange), Date.now(), {
            isCorrect: true,
            errorCode: this.getErrorCode(state, id)
        });

        state.pendingNewAttempt = true;
        return coverage >= (hit.getData("min_region_coverage") ?? GameConstants.PAINT.WIN_PERCENT);
    }

    private ensureAttemptOpen(state: ShapeTrackerState) {
        if (!state.hasShown || state.pendingNewAttempt) {
            state.tracker.onShown(Date.now());
            state.hasShown = true;
            state.pendingNewAttempt = false;
        }
    }

    private checkErase(state: ShapeTrackerState, id: string, cov: number, lastCov: number, match: number, spill: number, hit: Phaser.GameObjects.Image) {
        if (lastCov > 0 && cov < lastCov - 0.05) {
            this.updateInternalState(state, id, cov, match, spill, hit.getData("area_px") || 0);
            return true;
        }
        return false;
    }

    private getStrokeColor(colors: Set<number>, trueColor?: number): string {
        if (trueColor != null) return this.toHex(trueColor);
        const colorArr = Array.from(colors);
        return colorArr.length > 0 ? this.toHex(colorArr[colorArr.length - 1]) : "multi";
    }

    private calculateDeltas(state: ShapeTrackerState, id: string, cov: number, match: number, spill: number, hit: Phaser.GameObjects.Image, color: string) {
        const lastCov = state.lastReportedCoveragePerRegion.get(id) || 0;
        const lastMatch = state.lastReportedMatchPxPerRegion.get(id) || 0;
        const lastArea = state.lastReportedAreaPxPerRegion.get(id) || 0;
        const totalPx = hit.getData("area_px") || 0;

        const prevColor = state.lastUsedColorPerRegion.get(id);
        const colorChange = (prevColor && prevColor !== color) ? 1 : 0;
        state.lastUsedColorPerRegion.set(id, color);

        const delta = {
            region_id: hit.getData("partNote") || id,
            area_px: Math.max(0, totalPx - lastArea),
            paint_in_px: Math.max(0, match - lastMatch),
            paint_out_px: 0,
            coverage: Math.max(0, cov - lastCov),
            spill_ratio: 0,
            selected_color: color
        };

        this.updateInternalState(state, id, cov, match, spill, totalPx);
        return { delta, colorChange };
    }

    private updateInternalState(state: ShapeTrackerState, id: string, cov: number, match: number, spill: number, area: number) {
        state.lastReportedCoveragePerRegion.set(id, cov);
        state.lastReportedMatchPxPerRegion.set(id, match);
        state.lastReportedSpillPxPerRegion.set(id, spill);
        state.lastReportedAreaPxPerRegion.set(id, area);
    }

    private updateAccumulated(state: ShapeTrackerState, totalResult: any) {
        const idx = state.accumulatedRegionsResult.findIndex((r: any) => r.region_id === totalResult.region_id);
        if (idx >= 0) state.accumulatedRegionsResult[idx] = totalResult;
        else state.accumulatedRegionsResult.push(totalResult);
        if (totalResult.coverage >= (GameConstants.PAINT.WIN_PERCENT)) state.finishedRegions.add(totalResult.region_id);
    }

    private createAttemptData(color: string, delta: any, colorChange: number) {
        return {
            selected_color: color, brush_size: GameConstants.PAINT.BRUSH_SIZE,
            color_change_count: colorChange, brush_change_count: 0,
            regions_result: [delta], total_paint_in_px: delta.paint_in_px,
            total_paint_out_px: delta.paint_out_px, completion_pct: delta.coverage, spill_ratio: 0
        };
    }

    private getErrorCode(state: ShapeTrackerState, id: string) {
        const shapeId = (state as any)._shapeId || id;
        const count = this.hintCountPerShape.get(shapeId) || 0;
        return count > PaintTrackerManager.HINT_RELIANCE_THRESHOLD ? 'HINT_RELIANCE' : null;
    }

    private toHex(color: number): string {
        return `0x${color.toString(16).padStart(6, '0')}`;
    }
}