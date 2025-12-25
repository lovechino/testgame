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
        this.load.image(TextureKeys.S1_Rain, 'assets/images/S1/rain.png');
        this.load.image(TextureKeys.S1_IconOHeader, 'assets/images/ui/ellipse.png');
        this.load.image(TextureKeys.S1_ItemUmbrella, 'assets/images/S1/umbrella.png');
        this.load.image(TextureKeys.S1_ItemMushroom, 'assets/images/S1/mushroom.png');
        this.load.image(TextureKeys.S1_ItemLamp, 'assets/images/S1/lamp.png');
        this.load.image(TextureKeys.S1_TextResult, 'assets/images/S1/text_umbrella.png');

        // 3. Scene 2 Assets
        this.load.image(TextureKeys.S2_Banner, 'assets/images/S2/banner.png');
        this.load.image(TextureKeys.S2_TextBanner, 'assets/images/S2/text_banner.png');
        this.load.image(TextureKeys.S2_Board, 'assets/images/bg/board_scene_2.png');

        // - Các bộ phận nhân vật/chữ
        this.load.image(TextureKeys.S2_O_Outline, 'assets/images/S2/o_outline.png');
        this.load.image(TextureKeys.S2_O_Hat, 'assets/images/S2/o_hat.png');
        this.load.image(TextureKeys.S2_O_Body, 'assets/images/S2/o_body.png');
        
        this.load.image(TextureKeys.S2_Co_Outline, 'assets/images/S2/teacher.png');
        this.load.image(TextureKeys.S2_Co_Face, 'assets/images/S2/face.png');
        this.load.image(TextureKeys.S2_Co_Hair, 'assets/images/S2/hair.png');
        this.load.image(TextureKeys.S2_Co_Shirt, 'assets/images/S2/body.png');
        this.load.image(TextureKeys.S2_Co_HandL, 'assets/images/S2/left_hand.png');
        this.load.image(TextureKeys.S2_Co_HandR, 'assets/images/S2/right_hand.png');
        this.load.image(TextureKeys.S2_Co_Book, 'assets/images/S2/book.png');

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