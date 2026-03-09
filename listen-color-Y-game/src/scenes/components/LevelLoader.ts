import Phaser from 'phaser';
import { DataKeys } from '../../consts/Keys';
import { GameConstants } from '../../consts/GameConstants';
import { GameUtils } from '../../utils/GameUtils';
import { PaintManager } from '../../utils/PaintManager';

export class LevelLoader {
    static loadLevel(
        scene: Phaser.Scene,
        paintManager: PaintManager,
        onDebugRequest: (target: Phaser.GameObjects.Image) => void,
        autoScales?: { group1: number, group2: number },
        outlines?: { group1: { x: number, y: number }, group2: { x: number, y: number } }
    ) {
        const unfinishedPartsMap = new Map<string, Phaser.GameObjects.Image>();
        let totalParts = 0;

        const data = scene.cache.json.get(DataKeys.LevelS2Config);
        const manifest = scene.cache.json.get('game_manifest');
        console.log("Level Data:", data);

        if (manifest && manifest.scenes && manifest.scenes.scene2) {
            const partsCfg = manifest.scenes.scene2.parts;

            // Group 1 (Category 1)
            if (partsCfg.group1) {
                const combined = partsCfg.group1.map((p: any) => {
                    const configPart = data.goalkeeper?.parts?.find((cp: any) => cp.key === p.key);
                    return { ...p, ...configPart };
                });
                // USE autoScale group1 if available
                const scale = autoScales?.group1 ?? data.goalkeeper?.baseScale ?? 0.7;
                // Use absolute coordinates if available
                const baseX = outlines?.group1.x;
                const baseY = outlines?.group1.y;

                spawnParts(scene, paintManager, unfinishedPartsMap, combined,
                    baseX ?? data.goalkeeper?.baseX_pct ?? 0.32,
                    baseY ?? data.goalkeeper?.baseY_pct ?? 0.48,
                    scale, onDebugRequest, !!baseX, data.goalkeeper, "shape_1", "paint-shape");
            }

            // Group 2 (Category 2)
            if (partsCfg.group2) {
                const combined = partsCfg.group2.map((p: any) => {
                    const configPart = data.letter?.parts?.find((cp: any) => cp.key === p.key);
                    return { ...p, ...configPart };
                });
                // USE autoScale group2 if available
                const scale = autoScales?.group2 ?? data.letter?.baseScale ?? 0.7;
                const baseX = outlines?.group2.x;
                const baseY = outlines?.group2.y;

                spawnParts(scene, paintManager, unfinishedPartsMap, combined,
                    baseX ?? data.letter?.baseX_pct ?? 0.73,
                    baseY ?? data.letter?.baseY_pct ?? 0.48,
                    scale, onDebugRequest, !!baseX, data.letter, "char_1", "paint-char");
            }
        } else if (data) {
            // Fallback for games without manifest
            if (data.goalkeeper && data.goalkeeper.parts) {
                spawnParts(scene, paintManager, unfinishedPartsMap, data.goalkeeper.parts, data.goalkeeper.baseX_pct, data.goalkeeper.baseY_pct, data.goalkeeper.baseScale ?? 0.7, onDebugRequest, false, data, "shape_1", "paint-shape");
            }
            if (data.letter && data.letter.parts) {
                spawnParts(scene, paintManager, unfinishedPartsMap, data.letter.parts, data.letter.baseX_pct, data.letter.baseY_pct, data.letter.baseScale ?? 0.7, onDebugRequest, false, data, "char_1", "paint-char");
            }
        }

        totalParts = unfinishedPartsMap.size;
        return { partsMap: unfinishedPartsMap, totalParts };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function spawnParts(
    scene: Phaser.Scene,
    paintManager: PaintManager,
    map: Map<string, Phaser.GameObjects.Image>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts: any[],
    baseXOrPct: number,
    baseYOrPct: number,
    baseScale: number,
    onDebugRequest: (target: Phaser.GameObjects.Image) => void,
    isAbsolute: boolean = false,
    globalConfig?: any,
    shapeId: string = "shape_1",
    itemType: string = "paint"
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts.forEach((part: any, index: number) => {
        const id = part.key;
        const note = (part.note && part.note.trim() !== "") ? part.note.trim() : null;

        let cx, cy;
        if (isAbsolute) {
            cx = baseXOrPct;
            cy = baseYOrPct;
        } else {
            cx = GameUtils.getW(scene) * baseXOrPct;
            cy = GameUtils.getH(scene) * baseYOrPct;
        }

        // const scaleAdjust = part.scaleAdjust !== undefined ? part.scaleAdjust : 1;

        // // Apply scale to offsets to make them responsive
        // const layerX = cx + (part.offsetX || 0) * scale;
        // const layerY = cy + (part.offsetY || 0) * scale;

        // const hitArea = paintManager.createPaintableLayer(layerX, layerY, part.key, scale, id, scaleAdjust);


        const outlineScale = baseScale;
        const partScaleMul = part.scale !== undefined ? part.scale : 1;
        const scaleAdjust = part.scaleAdjust !== undefined ? part.scaleAdjust : 1;
        const combinedPartScale = outlineScale * partScaleMul;

        // Positional offset ONLY scales with base combined scale (outlineScale * partScaleMul)
        const layerX = cx + (part.offsetX || 0) * combinedPartScale;
        const layerY = cy + (part.offsetY || 0) * combinedPartScale;

        const minCov = part.min_region_coverage ?? globalConfig?.min_region_coverage ?? GameConstants.PAINT.WIN_PERCENT;

        const hitArea = paintManager.createPaintableLayer(layerX, layerY, part.key, combinedPartScale, id, scaleAdjust, minCov);

        // ✅ lưu scale rõ ràng
        hitArea.setData('outlineScale', outlineScale);
        hitArea.setData('partScaleMul', partScaleMul);
        hitArea.setData('scaleAdjust', scaleAdjust);
        hitArea.setData('originScale', combinedPartScale * scaleAdjust);

        hitArea.setData('hintX', part.hintX || 0);
        hitArea.setData('hintY', part.hintY || 0);
        hitArea.setData('baseX', cx);
        hitArea.setData('baseY', cy);
        hitArea.setData('partKey', part.key);
        hitArea.setData('partId', id);
        hitArea.setData('partNote', note);
        hitArea.setData('itemLabel', part.item_label || note || id);

        const prefixMatch = shapeId.match(/^([a-zA-Z]+_)/);
        const prefix = prefixMatch ? prefixMatch[1] : "shape_";
        hitArea.setData('shapeId', note || `${prefix}${index + 1}`);

        // ✅ NEW: fields cho expected
        hitArea.setData("itemTypeOverride", itemType);
        hitArea.setData("area_px", part.area_px ?? 0);
        hitArea.setData("allowed_colors", part.allowed_colors ?? ["any"]);
        hitArea.setData("correct_color", part.correct_color ?? null);

        // ✅ NEW: rule chung (nếu config có) - Note: accessing 'data' variable requires passing it or handling it differently.
        // Since 'data' is available in loadLevel but not passed to spawnParts cleanly in a way that includes global config, 
        // we might need to rely on defaults or pass it down. 
        // Checking `spawnParts` signature... it receives `parts`.
        // Let's assume defaults for now, or we should update `spawnParts` signature.
        // Actually, looking at `loadLevel`, `min_region_coverage` might be in `data`. 
        // For simplicity and to stick to user request, I will check if `part` has it first, else default.
        // Wait, the user said: `hitArea.setData("min_region_coverage", data.min_region_coverage ?? GameConstants.PAINT.WIN_PERCENT);`
        // But `data` is not passed to `spawnParts`!
        // I will add `globalConfig` to `spawnParts` arguments.

        hitArea.setData("min_region_coverage", minCov);
        hitArea.setData("max_spill_ratio", part.max_spill_ratio ?? 0);

        map.set(id, hitArea);

        hitArea.setInteractive();
        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                onDebugRequest(hitArea);
            }
        });
    }
    );

}
