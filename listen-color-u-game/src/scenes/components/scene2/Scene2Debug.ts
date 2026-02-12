import Phaser from 'phaser';

export class Scene2Debug {

    public static showAllOffsets(scene: Phaser.Scene, unfinishedPartsMap: Map<string, Phaser.GameObjects.Image>) {
        console.log("Showing all offsets for debugging...");
        unfinishedPartsMap.forEach((hitArea) => {
            const key = hitArea.getData('partKey');
            const ghost = scene.add.image(hitArea.x, hitArea.y, key)
                .setAlpha(0.5)
                .setDepth(150)
                .setScale(hitArea.getData('originScale'))
                .setInteractive({ useHandCursor: true });

            scene.input.setDraggable(ghost);
            hitArea.setData('ghostPart', ghost);

            ghost.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                ghost.x = dragX;
                ghost.y = dragY;

                const offX = Math.round(ghost.x - hitArea.getData('baseX'));
                const offY = Math.round(ghost.y - hitArea.getData('baseY'));
                console.log(`[DRAG OFFSET] Key: ${hitArea.getData('partKey')} -> offsetX: ${offX}, offsetY: ${offY}`);
            });
        });
        alert("Debug: Offsets enabled. Drag parts to adjust positions. Press 'P' to dump config.");
    }

    public static showAllHints(scene: Phaser.Scene, unfinishedPartsMap: Map<string, Phaser.GameObjects.Image>) {
        console.log("Showing all hints for debugging...");
        unfinishedPartsMap.forEach((hitArea) => {
            const originScale = hitArea.getData('originScale') || 1;
            const hX = hitArea.getData('hintX') || 0;
            const hY = hitArea.getData('hintY') || 0;

            const destX = hitArea.x + (hX * originScale);
            const destY = hitArea.y + (hY * originScale);

            const marker = scene.add.circle(destX, destY, 20, 0xff0000)
                .setAlpha(0.6)
                .setDepth(160)
                .setInteractive({ useHandCursor: true });

            scene.input.setDraggable(marker);
            hitArea.setData('hintMarker', marker);

            marker.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                marker.x = dragX;
                marker.y = dragY;

                // Update hint data
                const newHintX = (marker.x - hitArea.x) / originScale;
                const newHintY = (marker.y - hitArea.y) / originScale;
                hitArea.setData('hintX', Math.round(newHintX));
                hitArea.setData('hintY', Math.round(newHintY));

                console.log(`[DRAG HINT] Key: ${hitArea.getData('partKey')} -> hintX: ${Math.round(newHintX)}, hintY: ${Math.round(newHintY)}`);
            });
        });
        alert("Debug: Hint markers enabled. Drag red circles to adjust hint positions. Press 'P' to dump config.");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static dumpDebugConfig(unfinishedPartsMap: Map<string, Phaser.GameObjects.Image>) {
        console.log("===== GENERATING CONFIG JSON =====");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [];

        unfinishedPartsMap.forEach((hitArea) => {
            const ghost = hitArea.getData('ghostPart') as Phaser.GameObjects.Image;
            const cx = hitArea.getData('baseX');
            const cy = hitArea.getData('baseY');
            const key = hitArea.getData('partKey');

            // Priority to updated hint data from markers, otherwise use existing
            const hintX = hitArea.getData('hintX');
            const hintY = hitArea.getData('hintY');

            let offX = Math.round(hitArea.x - cx);
            let offY = Math.round(hitArea.y - cy);

            if (ghost) {
                offX = Math.round(ghost.x - cx);
                offY = Math.round(ghost.y - cy);
            }

            parts.push({
                key: key,
                offsetX: offX,
                offsetY: offY,
                hintX: hintX,
                hintY: hintY
            });
        });

        console.log(JSON.stringify(parts, null, 2));
        alert("Config dumped to Console! Press F12 to view.");
    }
}
