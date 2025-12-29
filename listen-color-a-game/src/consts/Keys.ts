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
    S1_Item_1 = 'item_1',
    S1_Item_2 = 'item_2',
    S1_Item_3 = 'item_3',
    S1_TextResult = 'text_result_s1',

    // --- Scene 2 (Tô Màu) ---
    S2_Banner = 'banner_s2',
    S2_TextBanner = 'text_banner_s2',
    S2_Board = 'board_s2',
    
    // Các bộ phận tô màu
    S2_A_Outline = 'a_outline',
    S2_A_Body = 'a_body',
    
    S2_Jacket_Outline = 'jacket_outline',
    S2_Jacket_1 = 'jacket_1',
    S2_Jacket_2 = 'jacket_2',
    S2_Jacket_3 = 'jacket_3',
    S2_Jacket_4 = 'jacket_4',
    S2_Jacket_5 = 'jacket_5',
    S2_Jacket_6 = 'jacket_6',
    S2_Jacket_7 = 'jacket_7',
    S2_Jacket_8 = 'jacket_8',
    S2_Jacket_9 = 'jacket_9',
    S2_Jacket_10 = 'jacket_10',
    S2_Jacket_11 = 'jacket_11',

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