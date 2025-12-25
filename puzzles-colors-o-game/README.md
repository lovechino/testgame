## Target - Requirements
- Làm game bài học số 2 trong SGK môn vietnamese-45
- Có 2 logic chính
    - 1. Tap to choose exact 
    - 2. Coloring 


## Explore-tech 
- Cần nắm công nghệ gì?
    - Node project 
    - Languge JS/TS
    - Phaser 


## Triển khai 

- Cách làm thông thường
    - 1. Mô hình xoắn ốc: thử nghiệm nhỏ -> mở rộng -> tinh chỉnh -> ...
    - 2. Chủân hóa: hệ thống hóa các module -> refactor + đóng gói các module -> đạt tiêu chuẩn deploy 

- Cách pair-coding với AI hiệu quả 
    - 1. Làm rõ đề bài -> bóc tách đề bài to thành các tác vụ chi tiết rõ ràng input-output 
    - 2. Thử nghiệm giải pháp 
        -> thử nhiều giải pháp khác nhau cho 1 tác vụ 
        -> các đánh giá giải pháp: các metrics cụ thể, các tradeoff là gì  
        -> chốt giải pháp tốt: phải hiểu thật chắc chắn về giải pháp, nắm tường tận công nghệ 
            -> 1. hiểu thật rõ API, platform bên dưới 
            -> 2. Hiểu tường tận luồng, thuật toán 
            -> 3. Từ đó có thể tự tùy biến mà ít dùng AI  
    - 3. Testing và fix issue 
        -> 1. Chắc chắn về logic muốn làm: logic muốn làm khớp với đúng code 
            - Comment mạch lạc từ cả repo -> từng module -> từng file -> từng method -> từng đoạn code 
        -> Cơ chế print log hiệu quả để trace issue 
            - Console print đơn giản
            - Tìm hiểu cơ chế logging hoặc các thu viện logging
                - Cơ chế tắt bật log
            - Cơ chế run debug để trace rõ giá trị các biến, ... 
        -> 2. Hiểu tường tạn mạch lạc về các loại API và cơ chế sử dụng 

## Đóng gói và bàn giao 
