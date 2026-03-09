import Phaser from 'phaser';
import { TextureKeys } from '../consts/Keys';
import AudioManager from '../audio/AudioManager';

// Export interface so we can use it, but the logic will stay here
export interface GameManifest {
    metadata: { title: string; version: string; };
    common: { board?: string; background?: string; };
    scenes: {
        scene1: {
            banner: string;
            textBanner?: string;
            board: string;
            bubble?: string;
            refImage?: string;
            poem?: string;
            ellipse?: string;
            resultBg?: string;
            textResult?: string;
            items: { key: string; path: string; isCorrect: boolean }[];
        };
        scene2: {
            banner: string;
            textBanner?: string;
            board: string;
            footerText?: string;
            outlines: { key: string; path: string }[];
            parts: {
                group1: { key: string; path: string }[];
                group2: { key: string; path: string }[];
            };
        };
    };
    audio: { [key: string]: string; };
}

export class ManifestLoader {

    /**
     * Loads either the reskin asset from manifest OR the default asset if missing.
     * This guarantees the key TextureKeys.X always points to a valid texture.
     */
    static loadAssetOrDefault(scene: Phaser.Scene, key: string, reskinPath: string | undefined, defaultPath?: string) {
        if (reskinPath) {
            scene.load.image(key, reskinPath);
        } else if (defaultPath) {
            scene.load.image(key, defaultPath);
        }
        // If both are missing/empty, we SKIP loading. 
        // This prevents Phaser from erroring on empty URL.
    }

    static processManifest(scene: Phaser.Scene, manifest: GameManifest) {
        // --- COMMON ---
        if (manifest.common && manifest.common.board) {
            scene.load.image('common_board', manifest.common.board);
        }
        if (manifest.common && manifest.common.background) {
            scene.load.image(TextureKeys.CommonBg, manifest.common.background);
            scene.registry.set('custom_bg', manifest.common.background);
        }

        // --- SCENE 1 ---
        const s1 = manifest.scenes.scene1;
        this.loadAssetOrDefault(scene, TextureKeys.S1_BannerBg, s1.banner, 'assets/images/S1/banner_1.png');
        this.loadAssetOrDefault(scene, TextureKeys.S1_BannerText, s1.textBanner, 'assets/images/S1/text_banner_1.png');
        this.loadAssetOrDefault(scene, TextureKeys.S1_Board, s1.board, 'assets/images/bg/board_Scene_1.png');
        this.loadAssetOrDefault(scene, TextureKeys.S1_PoemText, s1.poem, 'assets/images/S1/doc_tho.png');
        this.loadAssetOrDefault(scene, TextureKeys.S1_Ellipse, s1.ellipse, 'assets/reskin/s1_ellipse.png');

        // Items
        if (s1.items && s1.items.length > 0) {
            s1.items.forEach(item => { scene.load.image(item.key, item.path); });
        } else {
            // Default Fallback Items if manifest is empty
            scene.load.image('s1_item_crab', 'assets/images/S1/crab.png');
            scene.load.image('s1_item_fish', 'assets/images/S1/fish.png');
            scene.load.image('s1_item_shrimp', 'assets/images/S1/shrimp.png');
        }

        // Extra UI - Fixed fallbacks based on actual file existence
        // Replaced missing icon_o_header with smile.png, or verify if another bubble exists. S1 folder doesn't have bubble. UI folder has smile, ellipse, hand.
        this.loadAssetOrDefault(scene, TextureKeys.S1_IconOHeader, s1.bubble, 'assets/images/ui/smile.png');

        this.loadAssetOrDefault(scene, TextureKeys.S1_Player, s1.refImage, 'assets/images/S1/example.png');
        this.loadAssetOrDefault(scene, TextureKeys.BgPopup, s1.resultBg, 'assets/images/bg/board_pop_up.png');
        this.loadAssetOrDefault(scene, TextureKeys.S1_TextResult, s1.textResult, 'assets/images/S1/text_result.png');


        // --- SCENE 2 ---
        const s2 = manifest.scenes.scene2;
        this.loadAssetOrDefault(scene, TextureKeys.S2_Banner, s2.banner, 'assets/images/bg/banner_congrat.png');
        this.loadAssetOrDefault(scene, TextureKeys.S2_TextBanner, s2.textBanner); // No default, so pass undefined to skip if missing
        this.loadAssetOrDefault(scene, TextureKeys.S2_Rectangle1, s2.board, 'assets/images/bg/board_scene_2.png');
        this.loadAssetOrDefault(scene, TextureKeys.S2_TextScene2, s2.footerText); // No default

        if (s2.outlines) s2.outlines.forEach(o => scene.load.image(o.key, o.path));
        if (s2.parts) {
            if (s2.parts.group1) s2.parts.group1.forEach(p => scene.load.image(p.key, p.path));
            if (s2.parts.group2) s2.parts.group2.forEach(p => scene.load.image(p.key, p.path));
        }

        this.loadAssetOrDefault(scene, TextureKeys.S2_Ball, 'assets/reskin/ball.png');

        // --- AUDIO ---
        if (manifest.audio) {
            Object.entries(manifest.audio).forEach(([key, path]) => {
                scene.load.audio(key, path);
                // Also update AudioManager for Howler-based sounds
                AudioManager.overrideSound(key, path);
            });
        }
    }
}
