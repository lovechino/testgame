import Phaser from 'phaser';
import { GameConstants } from '../../../consts/GameConstants';
import { DataKeys, SceneKeys } from '../../../consts/Keys';
import { GameUtils } from '../../../utils/GameUtils';
import { PaintManager } from '../../../utils/PaintManager';
import AudioManager from '../../../audio/AudioManager';
import { game } from "@iruka-edu/mini-game-sdk";
import { sdk } from '../../../main';

export class Scene2LevelManager {
    private scene: Phaser.Scene;
    private paintManager: PaintManager;

    // State
    private unfinishedPartsMap: Map<string, Phaser.GameObjects.Image> = new Map();
    private finishedParts: Set<string> = new Set();
    private totalParts: number = 0;

    constructor(scene: Phaser.Scene, paintManager: PaintManager) {
        this.scene = scene;
        this.paintManager = paintManager;
    }

    public init() {
        this.unfinishedPartsMap.clear();
        this.finishedParts.clear();
        this.totalParts = 0;
    }

    public createLevel() {
        const data = this.scene.cache.json.get(DataKeys.LevelS2Config);
        if (data) {
            if (data.goalkeeper) this.spawnCharacter(data.goalkeeper);
            else if (data.teacher) this.spawnCharacter(data.teacher);
            if (data.letter) this.spawnCharacter(data.letter);
        }

        // SDK Integration
        game.setTotal(this.totalParts);
    }

    public getUnfinishedParts(): Phaser.GameObjects.Image[] {
        return Array.from(this.unfinishedPartsMap.values());
    }

    public isLevelComplete(): boolean {
        return this.finishedParts.size >= this.totalParts;
    }

    public getFinishedCount(): number {
        return this.finishedParts.size;
    }

    public getTotalParts(): number { // Added accessor
        return this.totalParts;
    }

    public getUnfinishedPartsMap(): Map<string, Phaser.GameObjects.Image> { // Added accessor for Debug
        return this.unfinishedPartsMap;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private spawnCharacter(config: any) {
        const cx = GameUtils.pctX(this.scene, config.baseX_pct);
        const cy = GameUtils.pctY(this.scene, config.baseY_pct);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config.parts.forEach((part: any, index: number) => {
            const id = `${part.key}_${index}`;
            const layerX = cx + part.offsetX;
            const layerY = cy + part.offsetY;

            const hitArea = this.paintManager.createPaintableLayer(layerX, layerY, part.key, part.scale, id);

            hitArea.setData('hintX', part.hintX || 0);
            hitArea.setData('hintY', part.hintY || 0);
            hitArea.setData('originScale', part.scale);
            hitArea.setData('baseX', cx);
            hitArea.setData('baseY', cy);
            hitArea.setData('partKey', part.key);

            // Log initial keys for user
            console.log(`[INITIAL] Key: "${part.key}" => offsetX: ${part.offsetX || 0}, offsetY: ${part.offsetY || 0}`);

            this.unfinishedPartsMap.set(id, hitArea);
            this.totalParts++;
        });

        this.scene.add.image(cx, cy, config.outlineKey).setScale(config.baseScale).setDepth(100).setInteractive({ pixelPerfect: true });
    }

    public handlePartComplete(id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) {
        this.finishedParts.add(id);

        // SDK: Record Correct & Update Score
        game.recordCorrect({ scoreDelta: 1 });
        if ((window as any).irukaGameState) {
            (window as any).irukaGameState.currentScore = this.finishedParts.size;
        }
        sdk.score(this.finishedParts.size, 1);

        // Minor progress update
        sdk.progress({
            levelIndex: 1,
            score: this.finishedParts.size,
        });

        if (usedColors.size === 1) {
            const singleColor = usedColors.values().next().value || 0;
            rt.setBlendMode(Phaser.BlendModes.NORMAL);
            rt.fill(singleColor);
        } else {
            console.log("Multi-color artwork preserved!");
        }

        this.unfinishedPartsMap.delete(id);

        AudioManager.play('sfx-ting');

        this.scene.tweens.add({ targets: rt, alpha: 0.8, yoyo: true, duration: GameConstants.SCENE2.TIMING.AUTO_FILL, repeat: 2 });

        if (this.finishedParts.size >= this.totalParts) {
            console.log("WIN!");

            // SDK: Level Complete
            game.finishQuestionTimer();
            game.finalizeAttempt();
            sdk.requestSave({
                score: this.finishedParts.size,
                levelIndex: 1,
            });
            sdk.progress({
                levelIndex: 2, // Next level index (meaning done with level 1)
                total: 2,
                score: this.finishedParts.size,
            });

            AudioManager.play('sfx-correct_s2');
            this.scene.time.delayedCall(GameConstants.SCENE2.TIMING.WIN_DELAY, () => this.scene.scene.start(SceneKeys.EndGame));
        } else {
            // SDK: Part Complete (Sub-task)
            game.finishQuestionTimer();
            // Start timer for next part
            game.startQuestionTimer();
        }
    }
}
