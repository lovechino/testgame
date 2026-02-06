import Phaser from 'phaser';

export class Scene2Debug {

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
            const hintX = hitArea.getData('hintX');
            const hintY = hitArea.getData('hintY');

            if (ghost) {
                const offX = Math.round(ghost.x - cx);
                const offY = Math.round(ghost.y - cy);

                parts.push({
                    key: key,
                    offsetX: offX,
                    offsetY: offY,
                    hintX: hintX,
                    hintY: hintY
                });
            }
        });

        console.log(JSON.stringify(parts, null, 2));
        alert("Config dumped to Console! Press F12 to view.");
    }
}
