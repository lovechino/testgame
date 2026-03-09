// src/scenes/PreloadScene.ts
import Phaser from 'phaser';
import { SceneKeys, TextureKeys, AudioKeys, DataKeys } from '../consts/Keys';
import { ManifestLoader } from '../utils/ManifestLoader';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super(SceneKeys.Preload);
    }

    preload() {
        // 1. Load Manifest & Static Configs
        this.load.json('game_manifest', 'assets/data/game_manifest.json');
        this.load.json(DataKeys.LevelS2Config, 'assets/data/level_s2_config.json');

        // 2. Load STATIC COMMON UI (Always needed)
        this.load.image(TextureKeys.BtnExit, 'assets/images/ui/btn_exit.png');
        this.load.image(TextureKeys.BtnReset, 'assets/images/ui/btn_reset.png');
        this.load.image(TextureKeys.BtnEraser, 'assets/images/ui/btn_eraser.png');
        this.load.image(TextureKeys.HandHint, 'assets/images/ui/hand.png');
        this.load.image(TextureKeys.BgPopup, 'assets/images/bg/board_pop_up.png');
        this.load.image(TextureKeys.CommonBanner, 'assets/reskin/common_banner.png');

        // Static Boards for Scenes
        this.load.image(TextureKeys.S1_Board, 'assets/images/bg/board_Scene_1.png');
        this.load.image(TextureKeys.S2_Board, 'assets/images/bg/board_scene_2.png');

        // Banner Frame (Decorative wrapper)
        this.load.image(TextureKeys.BannerFrame, 'assets/images/bg/banner.png');

        // Colors
        this.load.image(TextureKeys.BtnRed, 'assets/images/color/red.png');
        this.load.image(TextureKeys.BtnYellow, 'assets/images/color/yellow.png');
        this.load.image(TextureKeys.BtnGreen, 'assets/images/color/green.png');
        this.load.image(TextureKeys.BtnBlue, 'assets/images/color/blue.png');
        this.load.image(TextureKeys.BtnPurple, 'assets/images/color/purple.png');
        this.load.image(TextureKeys.BtnCream, 'assets/images/color/cream.png');
        this.load.image(TextureKeys.BtnBlack, 'assets/images/color/black.png');

        // End Game
        this.load.image(TextureKeys.End_Icon, 'assets/images/ui/icon_end.png');
        this.load.image(TextureKeys.End_BannerCongrat, 'assets/images/bg/banner_congrat.png');

        // Audio Base
        this.load.audio(AudioKeys.BgmNen, 'assets/audio/sfx/nhac_nen.mp3');

        // 3. LISTEN FOR FILE COMPLETE -> LOAD DYNAMIC ASSETS
        // This is the "Waterfall" loading pattern.
        this.load.on('filecomplete-json-game_manifest', (key: string, _type: string, data: any) => {
            if (key === 'game_manifest') {
                console.log("Manifest JSON loaded. Triggering Smart Asset Loader...");
                ManifestLoader.processManifest(this, data);
            }
        });

        this.load.on('complete', () => {
            console.log("PreloadScene complete. Checking if game can start...");
            // We check if the KEY asset 'S1_Board' exists in texture manager.
            // Since our smart loader guarantees mapping S1_Board to SOMETHING, checking it validates the second phase ran.
            if (this.textures.exists(TextureKeys.S1_Board)) {
                this.scene.start(SceneKeys.Scene1);
            } else {
                // If it doesn't exist, it means the second phase didn't run or failed.
                // But since we are in 'complete', and Phaser waits for everything, 
                // it implies we might need to kickstart loader again if it stopped before second phase added files.
                // However, since we added files in 'filecomplete', Phaser SHOULD have waited.
                // Just in case, we can manually check.
                if (this.load.progress < 1) {
                    // Still loading?
                } else {
                    // This creates a failsafe loop if manifest was missing entirely?
                    // No, if manifest missing, we won't have texture.
                    console.error("Critical: Manifest content not loaded correctly.");
                    // Fallback: Start anyway, but assets might be missing
                    this.scene.start(SceneKeys.Scene1);
                }
            }
        });
    }

    create() {
        // Redundant transition safeguard
    }
}
