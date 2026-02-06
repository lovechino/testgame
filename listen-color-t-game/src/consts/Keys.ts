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

    // --- Scene 1 (Hải sản) ---
    S1_BannerBg = 'banner_bg_s1',
    S1_BannerText = 'banner_text_s1',
    S1_Board = 'board_white',
    S1_PoemText = 'poem_text',
    S1_Rain = 'img_rain',
    S1_IconOHeader = 'icon_o_header',
    S1_Crab = 'crab',
    S1_Fish = 'fish',
    S1_Shrimp = 'shrimp',
    S1_TextResult = 'text_result_s1',
    S1_Example = 'example',
    S1_Player = "S1_Player",

    // --- Scene 2 (Tô Màu) ---
    S2_Banner = 'banner_s2',
    S2_TextBanner = 'text_banner_s2',
    S2_Board = 'board_s2',
    S2_Rectangle1 = 'S2_Rectangle1',
    S2_OcBody = 'S2_OcBody',
    S2_Oc1 = 'S2_Oc1',
    S2_Oc2 = 'S2_Oc2',
    S2_Oc3 = 'S2_Oc3',
    S2_Oc4 = 'S2_Oc4',
    S2_Oc5 = 'S2_Oc5',
    S2_Oc6 = 'S2_Oc6',
    S2_Oc7 = 'S2_Oc7',
    S2_Oc8 = 'S2_Oc8',
    S2_Octopus = 'S2_Octopus',
    S2_OctopusRes = 'S2_OctopusRes',
    S2_T = 'S2_T',
    S2_TResult = 'S2_TResult',
    S2_OcNew = 'S2_OcNew',
    S2_TextScene2 = 'S2_TextScene2',
    S2_Layer1 = 'S2_Layer1',
    S2_OctoResult = "S2_OctoResult",

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
    End_BannerCongrat = 'banner_congrat',
    // S2_TResult = "t_res",
    // S2_OctoResult = "octopus_res",
}

// 3. Tên Âm thanh (Audio)
export enum AudioKeys {
    BgmNen = 'bgm-nen'
}

// 4. Tên File Data (JSON)
export enum DataKeys {
    LevelS2Config = 'level_config'
}
