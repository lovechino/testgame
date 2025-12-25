// src/consts/GameConstants.ts

export const GameConstants = {
    // --- CẤU HÌNH CHUNG ---
    IDLE: {
        THRESHOLD: 10000,       // 10 giây không tương tác -> Gợi ý
        FADE_IN: 800,           // Thời gian hiện bàn tay
        SCALE: 300,             // Thời gian ấn xuống
        FADE_OUT: 500,          // Thời gian ẩn đi
        OFFSET_X: 50,           // Bàn tay lệch so với vật bao nhiêu px
        OFFSET_Y: 50,
    },

    // --- SCENE 1 (CÁI Ô) ---
    SCENE1: {
        UI: {
            BANNER_Y: 0.01,         // Vị trí Y của Banner (% màn hình)
            BOARD_OFFSET: 0.03,     // Khoảng cách từ Banner xuống Bảng
            BOARD_MARGIN_X: 0.01,   // Khoảng cách 2 bảng trái phải
            RAIN_OFFSET: 0.45,      // Mưa nằm ở 45% chiều cao bảng
            POEM_OFFSET: 0.05,      // Thơ cách dưới mưa 5%
            ICON_O_X: 0.13,         // Icon O lệch trái 13% chiều rộng bảng
            ICON_O_Y: 0.02,         // Icon O lệch xuống 2% chiều cao
            ITEM_OFFSET_X: 0.15,    // Khoảng cách item đồ vật so với tâm bảng
            ITEM_OFFSET_Y: 0.35,
        },
        ANIM: {
            FLOAT: 1500,        // Vật nhấp nhô
            POEM_FLOAT: 1200,
            ICON_SHAKE: 400,
            WRONG_SHAKE: 80,
            WIN_POPUP: 600,
        },
        TIMING: {
            DELAY_IDLE: 1000,   // Sau khi đọc xong câu đố 1s thì bắt đầu đếm idle
            DELAY_NEXT: 1000,   // Chuyển màn sau 1s
            DELAY_CORRECT_SFX: 1500, // Chờ đọc xong "Cái ô" mới khen
        }
    },

    // --- SCENE 2 (TÔ MÀU) ---
    SCENE2: {
        UI: {
            BANNER_Y: 0.01,
            BOARD_OFFSET: 0.03,
            PALETTE_Y: 0.89,
            PALETTE_SPACING: 0.07,
            HAND_INTRO_END_X: 0.37, // Vị trí bàn tay bay đến hướng dẫn
            HAND_INTRO_END_Y: 0.48,
        },
        TIMING: {
            INTRO_DELAY: 1000,      // Chờ bao lâu mới bắt đầu Intro
            RESTART_INTRO: 200,     // Delay khi xoay màn hình xong
            WIN_DELAY: 2500,        // Thắng xong chờ bao lâu chuyển màn
            AUTO_FILL: 100,         // Thời gian nhấp nháy khi tô xong 1 phần
        },
        INTRO_HAND: {
            MOVE: 600,
            TAP: 200,
            DRAG: 800,
            RUB: 400,
        }
    },

    // --- CẤU HÌNH VẼ ---
    PAINT: {
        BRUSH_SIZE: 100,
        WIN_PERCENT: 0.90,      // 90% là thắng
        DEFAULT_COLOR: 0xff0000
    },

    // --- END GAME ---
    ENDGAME: {
        UI: {
            BANNER_OFFSET: 0.12,    // Banner cách tâm giữa lên trên
            ICON_OFFSET: 150,       // Icon cách tâm giữa lên trên
            BTN_OFFSET: 0.2,        // Nút bấm cách tâm giữa xuống dưới
            BTN_SPACING: 250,       // Khoảng cách giữa 2 nút
        },
        CONFETTI: {
            DELAY: 100,
            MIN_DUR: 3000,
            MAX_DUR: 5000,
        },
        ANIM: {
            ICON_FLOAT: 800,
            ICON_SHAKE: 600,
            FIREWORKS_DELAY: 2000,
        }
    }
};