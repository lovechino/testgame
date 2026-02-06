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
        this.load.image(TextureKeys.S1_Example, 'assets/images/S1/example.png');
        this.load.image(TextureKeys.S1_Player, 'assets/images/S1/example.png');

        // New S1 Assets found in directory
        this.load.image(TextureKeys.S1_Crab, 'assets/images/S1/crab.png');
        this.load.image(TextureKeys.S1_Fish, 'assets/images/S1/fish.png');
        this.load.image(TextureKeys.S1_Shrimp, 'assets/images/S1/shrimp.png');

        // 3. Scene 2 Assets
        this.load.image(TextureKeys.S2_Banner, 'assets/images/S2/banner.png');
        this.load.image(TextureKeys.S2_TextBanner, 'assets/images/S2/text_banner.png');
        this.load.image(TextureKeys.S2_Board, 'assets/images/bg/board_scene_2.png');
        this.load.image(TextureKeys.S2_Rectangle1, 'assets/images/S2/Rectangle_1.png');

        // New S2 Assets found in directory
        this.load.image(TextureKeys.S2_OcBody, 'assets/images/S2/oc_body.png');
        this.load.image(TextureKeys.S2_Oc1, 'assets/images/S2/oc_1.png');
        this.load.image(TextureKeys.S2_Oc2, 'assets/images/S2/oc_2.png');
        this.load.image(TextureKeys.S2_Oc3, 'assets/images/S2/oc_3.png');
        this.load.image(TextureKeys.S2_Oc4, 'assets/images/S2/oc_4.png');
        this.load.image(TextureKeys.S2_Oc5, 'assets/images/S2/oc_5.png');
        this.load.image(TextureKeys.S2_Oc6, 'assets/images/S2/oc_6.png');
        this.load.image(TextureKeys.S2_Oc7, 'assets/images/S2/oc_7.png');
        this.load.image(TextureKeys.S2_Oc8, 'assets/images/S2/oc_8.png');
        this.load.image(TextureKeys.S2_Octopus, 'assets/images/S2/BẠCH TUỘC.png');
        this.load.image(TextureKeys.S2_OctoResult, 'assets/images/S2/octopus_res.png');
        this.load.image(TextureKeys.S2_T, 'assets/images/S2/t.png');
        this.load.image(TextureKeys.S2_TResult, 'assets/images/S2/t_res.png');
        this.load.image(TextureKeys.S2_OcNew, 'assets/images/S2/oc_new.png');
        this.load.image(TextureKeys.S2_TextScene2, 'assets/images/S2/text_scene2.png');



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
