# Tài liệu Mô tả Dự án: Listen & Color (Iruka Edu)

Dự án này là một trò chơi giáo dục tương tác dành cho lứa tuổi mầm non (4-5 tuổi), tập trung vào việc rèn luyện khả năng lắng nghe, nhận biết màu sắc và sự khéo léo thông qua hoạt động tô màu.

## 1. Chức năng và Phạm vi (Features & Scope)

### 1.1. Chức năng chính
*   **Scene 1 (Tìm kiếm & Ghép hình):** Người chơi thực hiện nhiệm vụ tìm kiếm hoặc ghép các mảnh ghép dựa trên hướng dẫn âm thanh hoặc hình ảnh. Đây là bước đệm để rèn luyện sự tập trung trước khi vào phần chính.
*   **Scene 2 (Tô màu tương tác):** 
    *   Cung cấp một bảng màu (Palette) đa dạng và công cụ tẩy (Eraser).
    *   Cơ chế tô màu linh hoạt: Người chơi có thể chọn màu và tô trực tiếp lên các vùng được chỉ định trên nhân vật (ví dụ: chú thủ môn).
    *   Hệ thống gợi ý thông minh (Smart Hint): Sau một khoảng thời gian người chơi không tương tác (Idle), bàn tay gợi ý sẽ xuất hiện để hướng dẫn người chơi bước tiếp theo.
*   **End Game (Kết thúc & Khen thưởng):**
    *   Hiệu ứng chúc mừng với pháo hoa, tiếng vỗ tay và banner chúc mừng.
    *   Tự động báo cáo kết quả (Scoring, Time, Stats) về hệ thống thông qua SDK.
    *   Cho phép người chơi Chơi lại (Restart) hoặc Thoát (Exit).

### 1.2. Phạm vi ứng dụng
*   Đối tượng: Trẻ em Việt Nam lứa tuổi 4-5.
*   Nền tảng: Web-based (chạy trên trình duyệt, tối ưu cho cả máy tính và thiết bị di động).
*   Mục tiêu: Giáo dục kết hợp giải trí (Edutainment).

## 2. Công nghệ và Kiến trúc phần mềm

### 2.1. Công nghệ sử dụng (Tech Stack)
*   **Engine:** [Phaser 3](https://phaser.io/) - Framework làm game 2D mạnh mẽ và phổ biến nhất cho nền tảng Web.
*   **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/) - Đảm bảo tính chặt chẽ của mã nguồn và dễ quản lý khi dự án mở rộng.
*   **Công cụ build:** [Vite](https://vitejs.dev/) - Giúp quá trình phát triển nhanh chóng với HMR (Hot Module Replacement).
*   **SDK:** `@iruka-edu/mini-game-sdk` - Bộ công cụ tích hợp sẵn cho việc quản lý trạng thái game, lưu trữ tiến trình và đồng bộ dữ liệu với hệ thống giáo dục của Iruka.

### 2.2. Kiến trúc phần mềm (Architecture)
Trò chơi được xây dựng theo kiến trúc hướng đối tượng (OOP) và dựa trên các mẫu thiết kế (Design Patterns) phổ biến trong game:

*   **Scene-based Pattern:** Mỗi giai đoạn của game được tách biệt thành các Scene (Scene1, Scene2, EndGameScene, Preload). Điều này giúp quản lý tài nguyên và logic độc lập.
*   **Manager Pattern:**
    *   `AudioManager`: Quản lý tập trung toàn bộ âm thanh, nhạc nền và giọng đọc.
    *   `PaintManager`: Chịu trách nhiệm về logic tô màu, xử lý mask, RenderTextures và tính toán diện tích tô màu.
    *   `IdleManager`: Theo dõi sự kiện người dùng để kích hoạt các hành động gợi ý tự động.
    *   `BackgroundManager`: Quản lý việc thay đổi và tối ưu hiển thị hình nền.
*   **Configuration-driven (Hướng cấu hình):** Toàn bộ vị trí vật thể, thông số kỹ thuật và dữ liệu level trong Scene 2 được lưu trữ trong file JSON (`level_s2_config.json`). Cách tiếp cận này giúp dễ dàng thay đổi nội dung trò chơi mà không cần can thiệp sâu vào code.
*   **SDK Integration Layer:** Một lớp trung gian kết nối giữa logic game và SDK để đảm bảo dữ liệu (điểm số, tiến độ, thời gian chơi) luôn được gửi về hệ thống chính xác và kịp thời.
