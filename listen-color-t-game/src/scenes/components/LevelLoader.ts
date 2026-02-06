import Phaser from 'phaser';
import { DataKeys } from '../../consts/Keys';
import { GameUtils } from '../../utils/GameUtils';
import { PaintManager } from '../../utils/PaintManager';

export class LevelLoader {
    static loadLevel(
        scene: Phaser.Scene,
        paintManager: PaintManager,
        onDebugRequest: (target: Phaser.GameObjects.Image) => void
    ) {
        const unfinishedPartsMap = new Map<string, Phaser.GameObjects.Image>();
        let totalParts = 0;

        const data = scene.cache.json.get(DataKeys.LevelS2Config);
        console.log("Level Data:", data);

        if (data) {
            if (data.goalkeeper && data.goalkeeper.parts) {
                spawnParts(scene, paintManager, unfinishedPartsMap, data.goalkeeper.parts, data.goalkeeper.baseX_pct, data.goalkeeper.baseY_pct, onDebugRequest);
            }
            if (data.letter && data.letter.parts) {
                spawnParts(scene, paintManager, unfinishedPartsMap, data.letter.parts, data.letter.baseX_pct, data.letter.baseY_pct, onDebugRequest);
            }
            // Fallback
            if (data.parts) {
                spawnParts(scene, paintManager, unfinishedPartsMap, data.parts, 0.5, 0.5, onDebugRequest);
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
    baseXPct: number,
    baseYPct: number,
    onDebugRequest: (target: Phaser.GameObjects.Image) => void
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts.forEach((part: any, index: number) => {
        const id = part.id || `${part.key}_${index}`;

        const cx = GameUtils.getW(scene) * baseXPct;
        const cy = GameUtils.getH(scene) * baseYPct;

        const layerX = cx + (part.offsetX || 0);
        const layerY = cy + (part.offsetY || 0);

        const scaleAdjust = part.scaleAdjust !== undefined ? part.scaleAdjust : 1;
        const scale = part.scale || 1.0;

        const hitArea = paintManager.createPaintableLayer(layerX, layerY, part.key, scale, id, scaleAdjust);

        hitArea.setData('hintX', part.hintX || 0);
        hitArea.setData('hintY', part.hintY || 0);
        hitArea.setData('originScale', scale);
        hitArea.setData('baseX', cx);
        hitArea.setData('baseY', cy);
        hitArea.setData('partKey', part.key);
        hitArea.setData('partId', id);

        map.set(id, hitArea);

        hitArea.setInteractive();
        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                onDebugRequest(hitArea);
            }
        });
    });
}
