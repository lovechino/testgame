# 🚀 Tối Ưu Hóa PaintManager: Kỹ Thuật "Freeze & Mask"

Tài liệu này giải thích cơ chế tối ưu hiệu năng trong game Tô Màu (`Scene2`), cụ thể là cách xử lý **10 bộ phận** (tay, chân, đầu...) mà không gây lag.

## 1. Vấn Đề (The Problem) ⚠️
- Một nhân vật có khoảng **10-15 bộ phận** riêng biệt để tô màu.
- Để tô vẽ được, mỗi bộ phận cần là một `RenderTexture`.
- **RenderTexture** rất "nặng" (tốn VRAM GPU và CPU mỗi frame).
- Nếu khởi tạo **10 RenderTextures cùng lúc** ngay đầu game:
    - Game sẽ bị giật/lag trên máy yếu.
    - Tốn bộ nhớ không cần thiết.
    - FPS tụt giảm nghiêm trọng.

## 2. Giải Pháp (The Solution) ✅
Chúng ta sử dụng kỹ thuật **Lazy Loading** kết hợp **Freezing (Đóng Băng)**.

> **Nguyên tắc cốt lõi:**
> "Tại một thời điểm, chỉ có **Duy Nhất 1 RenderTexture** được hoạt động. 9 bộ phận còn lại chỉ là **Image (Ảnh tĩnh)** vô tri vô giác, rất nhẹ."

### Cơ Chế Hoạt Động

#### A. Trạng Thái Tĩnh (Freeze / Passive)
- Khi người chơi KHÔNG tô vào bộ phận đó (ví dụ: đang tô Tay mà không tô Chân).
- Bộ phận đó chỉ là một `Phaser.GameObjects.Image` bình thường.
- Nó hiển thị Texture là kết quả của lần tô trước đó.
- **Chi phí hiệu năng:** Gần như bằng 0.

#### B. Trạng Thái Động (Unfreeze / Active)
- Khi người chơi **chạm tay** vào bộ phận (ví dụ: chạm vào Đầu).
- Hệ thống lập tức:
    1. **Biến hình:** Chuyển `Image` đó thành `RenderTexture`.
    2. **Khôi phục:** Vẽ lại những gì đã tô trước đó lên RenderTexture này.
    3. **Cho phép vẽ:** User bắt đầu di tay để tô tiếp.

---

## 3. Kỹ Thuật "Trim" & "MaskItem" (Quan Trọng) 🛠️

Đây là bước quan trọng nhất để ảnh không bị lỗi viền đen hoặc răng cưa khi chuyển đổi giữa Image và RenderTexture.

Khi chúng ta **Đóng Băng (Freeze)** một bộ phận (chuyển từ RT về Image), ta không thể cứ thế chụp màn hình rồi lưu lại, vì ảnh chụp sẽ là hình chữ nhật (chứa cả phần pixel trong suốt thừa thãi).

Chúng ta xử lý việc này trong hàm `bakePart`:

### Bước 1: Snapshot (Chụp ảnh)
Lấy toàn bộ nội dung hiện tại của `RenderTexture` ra một Canvas tạm.

### Bước 2: Apply Mask (Cắt gọt)
Đây chính là phần **maskItem** mà chúng ta đề cập.
Chúng ta sử dụng chính hình gốc của bộ phận đó (ví dụ hình cái tay gốc) để làm khuôn cắt.

```typescript
// Sử dụng chế độ hòa trộn 'destination-in' để CẮT 
// Giữ lại phần ảnh trùng với khuôn (source), phần thừa sẽ bị xóa thành trong suốt.
ctx.globalCompositeOperation = 'destination-in';
    frame.source.image, ... // HÌNH GỐC (Khuôn)
);
```

### Bước 3: Trim (Làm sạch) & Texture Packing

Để tối ưu dung lượng và bộ nhớ, chúng ta sử dụng kỹ thuật **Trim** (Cắt bỏ phần trong suốt thừa) thông qua công cụ đóng gói Atlas.

#### 1. Công Cụ: Free Texture Packer
Chúng ta sử dụng [Free Texture Packer](https://free-tex-packer.com/app/) để gộp nhiều ảnh lẻ thành 1 tấm ảnh lớn (Atlas).

**Cài đặt khuyến nghị:**
- **Texture Name**: `s2_atlas`
- **Format**: `Phaser 3` (Quan trọng!)
- **Allow Trim**: `BẬT` (Để cắt bỏ phần trong suốt xung quanh ảnh)
- **Packer**: `MaxRectsBin`

#### 2. Giải Mã File JSON (Atlas Structure)
Khi xuất ra file `.json` từ tool trên, Phaser đọc các thông số để biết cách vẽ lại ảnh đã bị cắt (Trim) về đúng vị trí cũ.

Ví dụ về cấu trúc một frame trong JSON:

```json
"doll_arm_left": {
    "frame": { "x": 1334, "y": 2, "w": 182, "h": 224 },
    "rotated": false,
    "trimmed": true,
    "spriteSourceSize": { "x": 37, "y": 66, "w": 182, "h": 224 },
    "sourceSize": { "w": 250, "h": 350 }
}
```

**Giải thích chi tiết:**
1.  **`frame`**: Vị trí và kích thước thực tế của ảnh **trên tấm Atlas lớn**.
    *   Đây là phần ảnh đã bị cắt gọn, chỉ chứa pixel có hình ảnh.
2.  **`sourceSize`**: Kích thước **GỐC** của ảnh khi chưa cắt.
    *   Ví dụ: Ảnh gốc là 250x350 (chứa nhiều khoảng trắng).
3.  **`spriteSourceSize` (Quan Trọng nhất)**:
    *   `x, y`: Độ lệch (Offset) của hình sau khi cắt so với gốc 0,0.
    *   **Ý nghĩa:** Khi Phaser vẽ, nó sẽ không vẽ ở góc 0,0. Nó sẽ dịch chuyển ảnh đi một đoạn `x=37, y=66` để chiếc tay nằm đúng vị trí khớp vai, thay vì bị lệch.

#### 3. Tại sao điều này quan trọng cho PaintManager?
Trong `PaintManager.ts`, khi chúng ta chuyển đổi giữa `RenderTexture` và `Image`:
- Chúng ta phải đọc các thông số `realWidth`, `realHeight`, `x`, `y` (tương ứng với `sourceSize` và `spriteSourceSize`) từ Texture Data của Phaser.
- Nếu không tính toán đúng phần bù này, khi "Rã đông" (Unfreeze), hình vẽ sẽ bị **LỆCH** so với viền (Outline).

```typescript
// PaintManager.ts: Đoạn code tính toán vị trí thực
const rtX = cfg.x - (frameData.realWidth * cfg.scale) / 2 + (frameData.x * cfg.scale);
const rtY = cfg.y - (frameData.realHeight * cfg.scale) / 2 + (frameData.y * cfg.scale);
```
Nhờ công thức này, dù ảnh trong Atlas đã bị cắt gọn gàng, khi hiển thị lên game nó vẫn nằm chuẩn xác từng pixel.

## 4. Tổng Kết
Nhờ kỹ thuật này, dù nhân vật có 50 bộ phận thì game vẫn mượt, bởi vì thực tế **Game chỉ đang gánh 1 bộ phận** duy nhất mà thôi.

**File liên quan:** `src/utils/PaintManager.ts`
