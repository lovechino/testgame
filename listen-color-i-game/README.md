# Dự án: Listen & Color - Vietnamese Educational Game

Chào mừng bạn đến với dự án game giáo dục giúp trẻ em từ 4-5 tuổi làm quen với tiếng Việt và màu sắc. Dự án được phát triển bằng **Phaser 3** và **TypeScript**.

## 1. Tải dự án từ GitHub

Để tải dự án này về máy cục bộ, bạn có thể thực hiện một trong hai cách sau:

### Cách 1: Sử dụng Git (Khuyên dùng)
Mở terminal/cmd và chạy lệnh:
```bash
git clone https://github.com/iruka-edu/vietnamese-game-age-4to5.git
cd listen-color-i-game
```

### Cách 2: Tải file Zip
1. Truy cập vào kho lưu trữ trên GitHub.
2. Nhấn vào nút **Code** (màu xanh).
3. Chọn **Download ZIP**.
4. Giải nén file vừa tải về và mở thư mục bằng VS Code.

---

## 2. Cài đặt thư viện (Dependencies)

Dự án này sử dụng các thư viện nội bộ của `iruka-edu` được lưu trữ trên **GitHub Packages**. Để cài đặt được, bạn cần cấu hình Token.

### Bước 1: Chuẩn bị GITHUB_TOKEN
Bạn cần một **Personal Access Token (classic)** từ GitHub với quyền `read:packages`.
1. Tạo file `.env` tại thư mục gốc (nếu chưa có).
2. Thêm dòng sau vào file `.env`:
   ```env
   GITHUB_TOKEN=your_personal_access_token_here
   ```

### Bước 2: Cài đặt
Chạy lệnh sau để cài đặt toàn bộ thư viện cần thiết:
```bash
npm install
```

---

## 3. Chạy dự án (How to Run)

### Chế độ phát triển (Development)
Để chạy game trong môi trường local và tự động cập nhật khi sửa code:
```bash
npm run dev
```
Sau khi chạy, hãy mở trình duyệt và truy cập địa chỉ hiển thị trên terminal (thường là `http://localhost:5173`).

### Xây dựng bản Production (Build)
Để đóng gói game để upload lên server:
```bash
npm run build
```
Sản phẩm sau khi đóng gói sẽ nằm trong thư mục `dist/`.

---

## 4. Các lệnh tiêu chuẩn khác
- **Linting:** Kiểm tra lỗi code: `npm run lint`
- **Testing:** Chạy unit test: `npm run test`
- **Preview:** Xem thử bản build production cục bộ: `npm run preview`

---

## Tài liệu liên quan
- Xem thêm chi tiết về chức năng và kiến trúc tại: [PROJECT_DOCS.md](./PROJECT_DOCS.md)

