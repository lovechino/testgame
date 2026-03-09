import Phaser from 'phaser';
import { DataKeys } from '../../consts/Keys';

export class Scene2Debug {

    static enableHintDebug(
        scene: Phaser.Scene,
        target: Phaser.GameObjects.Image,
        handHint: Phaser.GameObjects.Image
    ) {
        console.log(`[DEBUG] Selected part: ${target.getData('partId')}`);

        // Show hand at current hint pos
        const hX = target.getData('hintX');
        const hY = target.getData('hintY');
        const cx = target.getData('baseX');
        const cy = target.getData('baseY');

        const worldX = cx + hX;
        const worldY = cy + hY;

        handHint.setPosition(worldX, worldY).setAlpha(1).setScale(0.8).setDepth(300);

        // Enable drag on hand
        handHint.setInteractive({ draggable: true });
        scene.input.setDraggable(handHint);

        handHint.off('drag');
        handHint.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            handHint.setPosition(dragX, dragY);

            // Calculate new relative hint position
            // const scale = target.getData('originScale') || 1;
            // const newHintX = Math.round((dragX - cx) / scale);
            // const newHintY = Math.round((dragY - cy) / scale);

            const outlineScale = target.getData('outlineScale') || 1;
            const partScaleMul = target.getData('partScaleMul') || 1;
            const scaleAdjust = target.getData('scaleAdjust') || 1;
            const finalHintScale = outlineScale * partScaleMul * scaleAdjust;

            // Hint is relative to target (part) position
            const newHintX = Math.round((dragX - target.x) / finalHintScale);
            const newHintY = Math.round((dragY - target.y) / finalHintScale);

            console.log(`Hint Pos: x=${newHintX}, y=${newHintY}`);
            target.setData('hintX', newHintX);
            target.setData('hintY', newHintY);
        });
    }

    static debugShowAllHints(scene: Phaser.Scene, partsMap: Map<string, Phaser.GameObjects.Image>) {
        console.log("--- DEBUG HINTS (INTERACTIVE) ---");

        // Clear existing debug points/labels if any
        scene.children.getAll().forEach((child) => {
            if (child.getData('is_debug_visual')) child.destroy();
        });

        partsMap.forEach((part, id) => {
            const outlineScale = part.getData('outlineScale') || 1;
            const partScaleMul = part.getData('partScaleMul') || 1;
            const scaleAdjust = part.getData('scaleAdjust') ?? 1; // Explicit null/undefined check
            const finalHintScale = outlineScale * partScaleMul * scaleAdjust;

            const hX = (part.getData('hintX') || 0) * finalHintScale;
            const hY = (part.getData('hintY') || 0) * finalHintScale;
            const cx = part.getData('baseX');
            const cy = part.getData('baseY');

            const destX = cx + hX;
            const destY = cy + hY;

            console.log(`[INIT] Hint for ${id}: x=${destX}, y=${destY} (global offset: ${hX}, ${hY})`);

            // Creates a draggable red circle
            const debugPoint = scene.add.circle(destX, destY, 8, 0xff0000)
                .setDepth(300)
                .setInteractive({ draggable: true });

            // Label
            const label = scene.add.text(destX, destY + 10, id, {
                color: '#ffff00',
                fontSize: '12px',
                backgroundColor: '#000000'
            }).setDepth(301).setOrigin(0.5, 0);

            // Mark for easy clearing
            debugPoint.setData('is_debug_visual', true);
            label.setData('is_debug_visual', true);

            debugPoint.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                debugPoint.x = dragX;
                debugPoint.y = dragY;
                label.setPosition(dragX, dragY + 10);
            });

            debugPoint.on('dragend', () => {
                // const scale = part.getData('originScale') || 1; 
                const outlineScale = part.getData('outlineScale') || 1;
                const partScaleMul = part.getData('partScaleMul') || 1;
                const scaleAdjust = part.getData('scaleAdjust') ?? 1;
                const finalHintScale = outlineScale * partScaleMul * scaleAdjust;

                // Hint is relative to part position
                const newHintX = Math.round((debugPoint.x - part.x) / finalHintScale);
                const newHintY = Math.round((debugPoint.y - part.y) / finalHintScale);

                console.log(`%c[UPDATED] ${id} => hintX: ${newHintX}, hintY: ${newHintY}`, "color: #00ff00; font-weight: bold");

                part.setData('hintX', newHintX);
                part.setData('hintY', newHintY);
            });
        });
    }

    static debugShowAllOffsets(scene: Phaser.Scene, partsMap: Map<string, Phaser.GameObjects.Image>) {
        console.log("--- DEBUG OFFSETS (INTERACTIVE) ---");

        partsMap.forEach((part, id) => {
            const cx = part.getData('baseX');
            const cy = part.getData('baseY');

            // 1. Force draggable & Visible
            part.setInteractive({ draggable: true, pixelPerfect: false });
            part.setAlpha(1); // Make visible for debugging
            scene.input.setDraggable(part);

            // 2. Drag Logic
            part.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                part.setPosition(dragX, dragY);
            });

            part.on('dragend', () => {
                // const scale = part.getData('originScale') || 1;
                const outlineScale = part.getData('outlineScale') || 1;
                const partScaleMul = part.getData('partScaleMul') || 1;
                const combinedPartScale = outlineScale * partScaleMul;

                const newOffsetX = Math.round((part.x - cx) / combinedPartScale);
                const newOffsetY = Math.round((part.y - cy) / combinedPartScale);

                console.log(`%c[UPDATED OFFSET] "${id}": { offsetX: ${newOffsetX}, offsetY: ${newOffsetY} }`, "color: #00ffff; font-weight: bold");

                part.setData('offsetX', newOffsetX);
                part.setData('offsetY', newOffsetY);
            });
        });
    }

    static dumpDebugConfig(scene: Phaser.Scene, partsMap: Map<string, Phaser.GameObjects.Image>) {
        console.log("===== GENERATING CONFIG JSON =====");

        // Deep clone the full config to preserve structure
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fullConfig = JSON.parse(JSON.stringify(scene.cache.json.get(DataKeys.LevelS2Config)));

        partsMap.forEach((hitArea) => {
            const id = hitArea.getData('partId');
            const key = hitArea.getData('partKey');

            const hintX = hitArea.getData('hintX');
            const hintY = hitArea.getData('hintY');
            const cx = hitArea.getData('baseX');
            const cy = hitArea.getData('baseY');

            // const offsetX = Math.round(hitArea.x - cx);
            // const offsetY = Math.round(hitArea.y - cy);
            const outlineScale = hitArea.getData('outlineScale') || 1;
            const partScaleMul = hitArea.getData('partScaleMul') || 1;
            const combinedPartScale = outlineScale * partScaleMul;

            const offsetX = Math.round((hitArea.x - cx) / combinedPartScale);
            const offsetY = Math.round((hitArea.y - cy) / combinedPartScale);

            // Find in goalkeeper
            let found = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (fullConfig.goalkeeper && fullConfig.goalkeeper.parts) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = fullConfig.goalkeeper.parts.find((item: any) => {
                    return (item.id === id) || (item.key === key);
                });

                if (p) {
                    p.offsetX = offsetX;
                    p.offsetY = offsetY;
                    p.hintX = hintX;
                    p.hintY = hintY;
                    found = true;
                }
            }

            if (!found && fullConfig.letter && fullConfig.letter.parts) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = fullConfig.letter.parts.find((item: any) => {
                    return (item.id === id) || (item.key === key);
                });
                if (p) {
                    p.offsetX = offsetX;
                    p.offsetY = offsetY;
                    p.hintX = hintX;
                    p.hintY = hintY;
                    found = true;
                }
            }
        });

        console.log(JSON.stringify(fullConfig, null, 2));
    }
}
