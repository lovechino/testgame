// src/scenes/PreloadScene.ts
import Phaser from 'phaser';
import { SceneKeys, TextureKeys, AudioKeys, DataKeys } from '../consts/Keys';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super(SceneKeys.Preload);
    }

    preload() {
        // 1. UI Chung
        this.load.image(TextureKeys.BtnExit, 'assets/images/ui/btn_exit.png');
        this.load.image(TextureKeys.BtnReset, 'assets/images/ui/btn_reset.png');
        this.load.image(TextureKeys.BtnEraser, 'assets/images/ui/btn_eraser.png');
        this.load.image(TextureKeys.HandHint, 'assets/images/ui/hand.png');
        this.load.image(TextureKeys.BgPopup, 'assets/images/bg/board_pop_up.png');

        // 2. Scene 1 Assets
        this.load.image(TextureKeys.S1_BannerBg, 'assets/images/S1/banner_1.png');
        this.load.image(TextureKeys.S1_BannerText, 'assets/images/S1/text_banner_1.png');
        this.load.image(TextureKeys.S1_Board, 'assets/images/bg/board_Scene_1.png');
        this.load.image(TextureKeys.S1_PoemText, 'assets/images/S1/doc_tho.png');
        this.load.image(TextureKeys.S1_IconOHeader, 'assets/images/ui/ellipse.png');
        this.load.image(TextureKeys.S1_TextResult, 'assets/images/S1/text_result.png');
        this.load.image(TextureKeys.S1_Player, 'assets/images/S1/example.png'); // Using example helper as player placeholder if needed
        this.load.image(TextureKeys.S1_Example, 'assets/images/S1/example.png');

        // New S1 Assets found in directory
        this.load.image(TextureKeys.S1_Chicken, 'assets/images/S1/chicken.png');
        this.load.image(TextureKeys.S1_Dog, 'assets/images/S1/dog.png');
        this.load.image(TextureKeys.S1_Duck, 'assets/images/S1/duck.png');
        this.load.image(TextureKeys.S1_DuckResult, 'assets/images/S1/duck_result.png');

        // 3. Scene 2 Assets
        this.load.image(TextureKeys.S2_Banner, 'assets/images/S2/banner.png');
        this.load.image(TextureKeys.S2_TextBanner, 'assets/images/S2/text_banner.png');
        this.load.image(TextureKeys.S2_Board, 'assets/images/bg/board_scene_2.png');
        this.load.image(TextureKeys.S2_Layer1, 'assets/images/S2/Layer_1.png');
        this.load.image(TextureKeys.S2_Rectangle1, 'assets/images/S2/Rectangle_1.png');
        this.load.image(TextureKeys.S2_DuckResult, 'assets/images/S2/duck_result.png');
        this.load.image(TextureKeys.S2_Layer2, 'assets/images/S2/Layer_1.png');
        this.load.image(TextureKeys.S2_IconResult, 'assets/images/S2/i_result.png');
        this.load.image(TextureKeys.S2_IconNew, 'assets/images/S2/i.png');
        // New S2 Assets found in directory
        this.load.image(TextureKeys.S2_DuckBody, 'assets/images/S2/duck_body.png');
        this.load.image(TextureKeys.S2_Speculum, 'assets/images/S2/speculum.png');



        // - Nút màu
        this.load.image(TextureKeys.BtnRed, 'assets/images/color/red.png');
        this.load.image(TextureKeys.BtnYellow, 'assets/images/color/yellow.png');
        this.load.image(TextureKeys.BtnGreen, 'assets/images/color/green.png');
        this.load.image(TextureKeys.BtnBlue, 'assets/images/color/blue.png');
        this.load.image(TextureKeys.BtnPurple, 'assets/images/color/purple.png');
        this.load.image(TextureKeys.BtnCream, 'assets/images/color/cream.png');
        this.load.image(TextureKeys.BtnBlack, 'assets/images/color/black.png');

        // - Config JSON
        this.load.json(DataKeys.LevelS2Config, 'assets/data/level_s2_config.json');

        // 4. End Game Assets
        this.load.image(TextureKeys.End_Icon, 'assets/images/ui/icon_end.png');
        this.load.image(TextureKeys.End_BannerCongrat, 'assets/images/bg/banner_congrat.png');

        // 5. Audio (Phaser)
        this.load.audio(AudioKeys.BgmNen, 'assets/audio/sfx/nhac_nen.mp3');
    }

    create() {
        // Tải xong thì chuyển sang Scene 1
        this.scene.start(SceneKeys.Scene1);
    }
}
