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
    BackgroundGame = 'background_game',
    Smile = 'smile',

    // --- Scene 1 (Cái Ô) ---
    S1_BannerBg = 'banner_bg_s1',
    S1_BannerText = 'banner_text_s1',
    S1_Board = 'board_white',
    S1_PoemText = 'poem_text',
    S1_Rain = 'img_rain',
    S1_IconOHeader = 'icon_o_header',
    S1_ItemUmbrella = 'item_umbrella',
    S1_ItemMushroom = 'item_mushroom',
    S1_ItemLamp = 'item_lamp',
    S1_TextResult = 'text_result_s1',
    S1_Example = 'example',
    S1_Police = 'police',
    S1_TextUmbrella = 'text_umbrella',
    S1_Engineer = 'engineer',
    S1_Player = "S1_Player",
    S1_soccer = "S1_soccer",
    S1_doctor = "S1_doctor",
    S1_Chicken = "S1_Chicken",
    S1_Dog = "S1_Dog",
    S1_Duck = "S1_Duck",

    // --- Scene 2 (Tô Màu) ---
    S2_Banner = 'banner_s2',
    S2_TextBanner = 'text_banner_s2',
    S2_Board = 'board_s2',
    S2_Frame73 = 'frame_73',
    S2_Frame76 = 'frame_76',
    S2_Group287 = 'group_287',
    S2_Layer1 = 'layer_1',
    S2_Rectangle1 = 'rectangle_1',
    S2_Bowl = 'S2_Bowl',
    S2_Face = 'S2_Face',
    S2_Hair = 'S2_Hair',
    S2_Hat = 'S2_Hat',
    S2_Shirt = 'S2_Shirt',
    S2_Skirt = 'S2_Skirt',
    S2_UResult = 'S2_UResult',
    S2_UW = 'S2_UW',
    S2_Vaso = 'S2_Vaso',
    S2_DuckBody = 'S2_DuckBody',
    S2_Speculum = 'S2_Speculum',

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
    S2_Arm1 = "S2_Arm1",
    S2_Arm2 = "S2_Arm2",
    S2_Khay = "S2_Khay",
    S2_DuckResult = "S2_DuckResult",
    S1_DuckResult = "S1_DuckResult",
    S2_Layer2 = "S2_Layer2",
    S2_IconResult = "S2_IconResult",
    S2_IconNew = "S2_IconNew",
}

// 3. Tên Âm thanh (Audio)
export enum AudioKeys {
    BgmNen = 'bgm-nen'
}

// 4. Tên File Data (JSON)
export enum DataKeys {
    LevelS2Config = 'level_config'
}
