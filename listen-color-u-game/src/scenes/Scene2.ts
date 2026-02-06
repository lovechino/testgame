import Phaser from 'phaser';

import { SceneKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants';
import { IdleManager } from '../utils/IdleManager';
import { PaintManager } from '../utils/PaintManager';
import { playVoiceLocked, setGameSceneReference, resetVoiceState } from '../utils/rotateOrientation';
import { sdk } from '../main';

// Components
import { Scene2UI } from './components/scene2/Scene2UI';
import { Scene2LevelManager } from './components/scene2/Scene2LevelManager';
import { Scene2Intro } from './components/scene2/Scene2Intro';
import { Scene2Debug } from './components/scene2/Scene2Debug';
import { game } from "@iruka-edu/mini-game-sdk";

export default class Scene2 extends Phaser.Scene {
    private paintManager!: PaintManager;
    private idleManager!: IdleManager;

    private uiManager!: Scene2UI;
    private levelManager!: Scene2LevelManager;
    private introManager!: Scene2Intro;

    constructor() { super(SceneKeys.Scene2); }

    init() {
        if (this.levelManager) this.levelManager.init();
        if (this.uiManager) this.uiManager.init();
    }

    create() {
        this.setupSystem();

        this.uiManager.createUI();
        this.levelManager.createLevel();

        // SDK Integration
        sdk.progress({ levelIndex: 1, total: 2 });
        game.startQuestionTimer();

        if ((window as any).irukaGameState) {
            (window as any).irukaGameState.currentScore = 0;
        }

        this.setupInput();
        this.introManager.playIntroSequence();

        this.events.on('wake', () => {
            this.idleManager.reset();
            if (this.input.keyboard) this.input.keyboard.enabled = true;
        });
    }

    update(time: number, delta: number) {
        if (!this.paintManager.isPainting() && !this.introManager.isActive() && !this.levelManager.isLevelComplete()) {
            this.idleManager.update(delta);
        }
    }

    shutdown() {
        if (this.introManager) this.introManager.stopIntro();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.paintManager = null as any;
    }

    private setupSystem() {
        resetVoiceState();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gameScene = this;
        setGameSceneReference(this);

        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => this.introManager.showHint());

        this.paintManager = new PaintManager(this, (id, rt, usedColors) => {
            this.levelManager.handlePartComplete(id, rt, usedColors);
        });

        // Init Components
        this.uiManager = new Scene2UI(this, this.paintManager);
        this.levelManager = new Scene2LevelManager(this, this.paintManager);
        this.introManager = new Scene2Intro(this, this.uiManager, this.levelManager, this.idleManager);
    }

    private setupInput() {
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.paintManager.handlePointerMove(p));
        this.input.on('pointerup', () => this.paintManager.handlePointerUp());

        this.input.on('pointerdown', () => {
            this.idleManager.reset();
            this.introManager.stopIntro();
        });

        // Debug Key P
        this.input.keyboard?.on('keydown-P', () => {
            Scene2Debug.dumpDebugConfig(this.levelManager.getUnfinishedPartsMap());
        });
    }

    public restartIntro() {
        this.introManager.restartIntro();
    }
}
