// src/consts/Keys.ts

// 1. Tên các Màn chơi (Scene)
export enum SceneKeys {
    Preload = 'PreloadScene',
    Scene1 = 'Scene1',
    Scene2 = 'Scene2',
    EndGame = 'EndGameScene'
}

// 2. Tên các Hình ảnh (Texture)
export enum TextureKeys {
    // --- UI Dùng Chung ---
    BtnExit = 'btn_exit',
    BtnReset = 'btn_reset',
    BtnEraser = 'btn_eraser',
    HandHint = 'hand_hint',
    BgPopup = 'bg_popup', // board_pop_up dùng chung
    
    // --- Scene 1 (Thước kẻ) ---
    S1_BannerBg = 'banner_bg_s1',
    S1_BannerText = 'banner_text_s1',
    S1_Board = 'board_white',
    S1_PoemText = 'poem_text',
    S1_Illustration = 'img_illustration',
    S1_IconOHeader = 'icon_o_header',
    S1_ItemPen = 'item_pen',
    S1_ItemBox = 'item_box',
    S1_ItemRuler = 'item_ruler',
    S1_TextResult = 'text_result_s1',

    // --- Scene 2 (Tô Màu) ---
    S2_Banner = 'banner_s2',
    S2_TextBanner = 'text_banner_s2',
    S2_Board = 'board_s2',
    
    // Các bộ phận tô màu
    S2_O_Outline = 'o_outline',
    S2_O_Body = 'o_body',
    
    S2_Flag_Outline = 'flag_outline',
    S2_Flag_Left = 'flag_left',
    S2_Flag_Mid = 'flag_mid',
    S2_Flag_Right = 'flag_right',

    // Các nút màu
    BtnRed = 'btn_red',
    BtnYellow = 'btn_yellow',
    BtnGreen = 'btn_green',
    BtnBlue = 'btn_blue',
    BtnPurple = 'btn_purple',
    BtnCream = 'btn_cream',
    BtnBlack = 'btn_black',

    // --- End Game ---
    End_Icon = 'icon_end',
    End_BannerCongrat = 'banner_congrat'
}

// 3. Tên Âm thanh (Audio)
export enum AudioKeys {
    BgmNen = 'bgm-nen'
}

// 4. Tên File Data (JSON)
export enum DataKeys {
    LevelS2Config = 'level_config'
}