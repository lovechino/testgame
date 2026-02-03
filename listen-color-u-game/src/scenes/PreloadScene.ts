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
        this.load.image(TextureKeys.S1_Player, 'assets/images/S1/Group 272.png');
        this.load.image(TextureKeys.S1_soccer, 'assets/images/S1/soccer.png');
        this.load.image(TextureKeys.S1_enginer, 'assets/images/S1/enginer.png');
        this.load.image(TextureKeys.S1_doctor, 'assets/images/S1/doctor.png');

        // 3. Scene 2 Assets
        this.load.image(TextureKeys.S2_Banner, 'assets/images/S2/banner.png');
        this.load.image(TextureKeys.S2_TextBanner, 'assets/images/S2/text_banner.png');
        this.load.image(TextureKeys.S2_Board, 'assets/images/bg/board_scene_2.png');
        this.load.image(TextureKeys.S2_goal, 'assets/images/S2/goal.png');
        this.load.image(TextureKeys.S2_player, 'assets/images/S2/Layer_1.png');
        this.load.image(TextureKeys.S2_text, 'assets/images/S2/Frame 73.png');
        // - Các bộ phận nhân vật/chữ
        // this.load.image(TextureKeys.S2_O_Outline, 'assets/images/S2/o_outline.png');
        // this.load.image(TextureKeys.S2_O_Hat, 'assets/images/S2/o_hat.png');
        // this.load.image(TextureKeys.S2_O_Body, 'assets/images/S2/o_body.png');
        this.load.image(TextureKeys.S2_text_relust, 'assets/images/S2/Frame 76.png');
        this.load.image(TextureKeys.S2_U_Outline, 'assets/images/S2/Frame 73.png');

        this.load.image(TextureKeys.S2_Co_Outline, 'assets/images/S2/teacher.png');
        this.load.image(TextureKeys.S2_Co_Face, 'assets/images/S2/face.png');
        this.load.image(TextureKeys.S2_Co_Hair, 'assets/images/S2/hair.png');
        this.load.image(TextureKeys.S2_Co_Shirt, 'assets/images/S2/body.png');
        this.load.image(TextureKeys.S2_Co_HandL, 'assets/images/S2/left_hand.png');
        this.load.image(TextureKeys.S2_Co_HandR, 'assets/images/S2/right_hand.png');
        this.load.image(TextureKeys.S2_Co_Book, 'assets/images/S2/book.png');
        this.load.image(TextureKeys.S2_vector, 'assets/images/S2/Vector.png');
        this.load.image(TextureKeys.S2_vector2, 'assets/images/S2/Vector (1).png');
        this.load.image(TextureKeys.S2_vector3, 'assets/images/S2/Vector (2).png');
        this.load.image(TextureKeys.S2_vector4, 'assets/images/S2/Vector (3).png');
        this.load.image(TextureKeys.S2_vector5, 'assets/images/S2/Vector (4).png');
        this.load.image(TextureKeys.S2_vector6, 'assets/images/S2/Vector (5).png');
        this.load.image(TextureKeys.S2_vector7, 'assets/images/S2/Vector (6).png');
        this.load.image(TextureKeys.S2_vector8, 'assets/images/S2/Vector (7).png');
        this.load.image(TextureKeys.S2_vector9, 'assets/images/S2/Vector (8).png');
      
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
