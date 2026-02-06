# Tài liệu Dự án: Game Nghe và Tô màu (Listen & Color)

## 1. Mô tả Tổng quan (Project Overview)
Đây là một trò chơi giáo dục dành cho trẻ em từ 4-5 tuổi, tập trung vào việc phát triển kỹ năng nghe hiểu tiếng Việt, nhận biết đồ vật và làm quen với màu sắc. Game được thiết kế dưới dạng minigame tương tác với các nhân vật và tình huống gần gũi.

### Phạm vi chức năng (Scope of Functionality):
- **Phát hiện và gợi ý (Idle Detection):** Nếu người chơi không tương tác sau một khoảng thời gian, hệ thống sẽ tự động hiển thị gợi ý (bàn tay chỉ dẫn).
- **Phản hồi âm thanh (Audio Feedback):** Mọi hành động đúng/sai đều có hiệu ứng âm thanh (SFX) và voice hướng dẫn từ nhân vật.
- **Tương tác đa chạm/di chuột:** Hỗ trợ tốt trên cả thiết bị di động (cảm ứng) và máy tính.
- **Tích hợp SDK giáo dục:** Theo dõi tiến độ, ghi nhận điểm số và lưu trạng thái hoàn thành thông qua hệ thống Mini Game SDK.

---

## 2. Các Màn chơi (Game Scenes)

### Scene 1: Giải đố (Riddle Scene)
- **Mục tiêu:** Nghe câu đố và tìm đúng vật thể được nhắc đến (Cái Ô).
- **Hành động:** 
    - Nghe hướng dẫn và bài thơ đố.
    - Chọn 1 trong các vật thể hiển thị trên màn hình (ví dụ: con chó, con gà, con vịt/cái ô).
- **Logic:** Khi chọn đúng, vật thể sẽ bay vào bảng kết quả và chuyển sang màn tiếp theo.

### Scene 2: Tô màu (Coloring Scene)
- **Mục tiêu:** Tô màu các bộ phận của hình vẽ theo ý thích.
- **Hành động:**
    - Chọn màu từ bảng màu (Palette).
    - Di chuột hoặc chạm để tô vào các vùng xác định (như thân con vịt, chữ cái/biểu tượng).
- **Logic:**
    - Sử dụng `PaintManager` để tính toán diện tích đã tô.
    - Khi đạt ngưỡng >90% (Win Percent), vùng đó sẽ tự động hoàn thiện và phát tín hiệu hoàn thành.
    - Sau khi tô xong toàn bộ các bộ phận, người chơi sẽ thắng cuộc.

### EndGame: Chúc mừng (Celebration)
- Hiển thị hiệu ứng pháo hoa, vỗ tay và nút để chơi lại hoặc thoát game.

---

## 3. Công nghệ và Kiến trúc (Technology & Architecture)

### Công nghệ sử dụng (Tech Stack):
- **Engine:** [Phaser 3](https://phaser.io/) - Framework chuyên dụng cho game HTML5 2D.
- **Language:** [TypeScript](https://www.typescriptlang.org/) - Đảm bảo tính chặt chẽ về dữ liệu và dễ bảo trì.
- **Build Tool:** [Vite](https://vitejs.dev/) - Giúp đóng gói và chạy game nhanh chóng.
- **Libraries:**
    - `@iruka-edu/mini-game-sdk`: Tích hợp báo cáo kết quả học tập.
    - `Howler.js`: Quản lý âm thanh đa kênh.

### Kiến trúc Phần mềm (Software Architecture):
Game được xây dựng theo mô hình hướng đối tượng (OOP) và phân tách trách nhiệm (Separation of Concerns):

1. **Quản lý Tài nguyên (Asset Management):**
    - `Keys.ts`: Quản lý tập trung toàn bộ String Keys của hình ảnh và âm thanh bằng Enum, tránh sai sót khi gọi tên file.

2. **Cấu hình Tập trung (Centralized Config):**
    - `GameConstants.ts`: Chứa toàn bộ các hằng số về thời gian (timing), tỉ lệ (scale), vị trí (offset). Cho phép cân chỉnh game mà không cần can thiệp vào logic code.
    - `level_s2_config.json`: Cấu hình chi tiết các bộ phận cần tô màu, giúp dễ dàng thay đổi hình vẽ hoặc thêm level mới.

3. **Thành phần UI (UI Components):**
    - Các file trong `src/scenes/components/` (như `Scene1UI`, `Scene2UI`) tách rời việc tạo giao diện khỏi logic điều khiển chính của Scene, giúp code gọn gàng.

4. **Hệ thống Quản lý (Managers/Utilities):**
    - `PaintManager.ts`: Xử lý logic tô màu phức tạp (Render Texture, calculation).
    - `IdleManager.ts`: Theo dõi thời gian không hoạt động của người chơi.
    - `AudioManager.ts`: Đảm bảo âm thanh được tải và phát đúng thời điểm.

5. **Luồng dữ liệu (Data Flow):**
    - Game -> SDK: Gửi sự kiện `recordCorrect`, `score`, `progress`.
    - SDK -> Game: Nhận các lệnh điều khiển chung nếu cần.
