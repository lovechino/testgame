# 🌈 Trò chơi: Lắng nghe và Tô màu (Listen & Color)

**Listen & Color** là một ứng dụng giáo dục tương tác được thiết kế dành riêng cho trẻ em từ 4-5 tuổi. Trò chơi kết hợp giữa việc rèn luyện kỹ năng lắng nghe hướng dẫn và phát triển năng khiếu thẩm mỹ thông qua hoạt động tô màu sinh động.

---

## 🚀 Tính năng nổi bật

-   **Học thông qua chơi (Edutainment):** Giúp bé nhận biết màu sắc và đồ vật một cách tự nhiên.
-   **Tương tác mượt mà:** Cơ chế tô màu dựa trên mask và RenderTextures, mang lại trải nghiệm vẽ chân thực trên web.
-   **Hệ thống gợi ý thông minh (Smart Hint):** Tự động hướng dẫn khi bé gặp khó khăn hoặc dừng tương tác quá lâu.
-   **Âm thanh sống động:** Tích hợp giọng đọc hướng dẫn tiếng Việt và hiệu ứng âm thanh khen thưởng (Fireworks, Applause).
-   **Đồng bộ dữ liệu:** Tích hợp chặt chẽ với hệ thống Iruka Edu thông qua Game SDK để theo dõi tiến độ và kết quả học tập của bé.

---

## �️ Công nghệ sử dụng

-   **Core Engine:** [Phaser 3](https://phaser.io/) (v3.85.0)
-   **Development:** Vite + TypeScript
-   **SDK:** @iruka-edu/mini-game-sdk
-   **Architecture:** Scene-based, Manager Pattern (Audio, Paint, Idle).

---

## 📂 Cấu trúc dự án chính

-   `src/scenes/`: Chứa logic của từng màn chơi (`Scene1`, `Scene2`, `EndGameScene`).
-   `src/utils/`: Các bộ quản lý cốt lõi (`PaintManager`, `AudioManager`, `IdleManager`).
-   `public/assets/`: Tài nguyên hình ảnh, âm thanh và dữ liệu cấu hình level (JSON).
-   `GAME_DOCS.md`: Tài liệu chi tiết về kiến trúc và chức năng phần mềm.

---

## 💻 Hướng dẫn phát triển

### 1. Cài đặt
```bash
npm install
```

### 2. Chạy môi trường Dev
```bash
npm run dev
```

### 3. Build Production
```bash
npm run build
```

---

## 🎮 Quy trình game (Flow)

1.  **Scene 1:** Bé nghe hướng dẫn và thực hiện thử thách tìm kiếm/ghép hình cơ bản.
2.  **Scene 2:** Bé thực hiện tô màu nhân vật theo ý thích hoặc theo hướng dẫn.
3.  **EndGame:** Hiển thị kết quả, bắn pháo hoa và gửi dữ liệu báo cáo về hệ thống host.

---

## � Liên hệ & Tài liệu
Để tìm hiểu sâu hơn về kiến trúc kỹ thuật, vui lòng đọc file [GAME_DOCS.md](GAME_DOCS.md).