import Phaser from 'phaser';

/**
 * Hiển thị FPS ở góc màn hình.
 * Chỉ cần gọi 1 lần trong hàm create(), nó sẽ tự cập nhật.
 */
export function createFPSCounter(scene: Phaser.Scene) {
    // 1. Tạo text hiển thị
    const debugText = scene.add.text(10, 50, 'FPS: 0', {
        font: '30px Arial',
        color: '#00ff00',
        backgroundColor: '#000000'
    });

    // 2. Set thuộc tính để nó luôn nổi lên trên cùng và không chạy theo camera
    debugText.setScrollFactor(0);
    debugText.setDepth(9999);

    // 3. TỰ ĐỘNG CẬP NHẬT (Magic nằm ở đây)
    // Thay vì bạn viết trong hàm update() của Scene, ta gán sự kiện update cho chính Scene đó tại đây.
    const updateListener = () => {
        const fps = Math.floor(scene.game.loop.actualFps);
        debugText.setText(`FPS: ${fps}`);

        // Logic đổi màu cảnh báo tụt FPS
        if (fps < 30) {
            debugText.setColor('#ff0000'); // Đỏ: Giật lag
        } else if (fps < 55) {
            debugText.setColor('#ffff00'); // Vàng: Hơi lag
        } else {
            debugText.setColor('#00ff00'); // Xanh: Mượt
        }
    };

    // Đăng ký sự kiện update chạy mỗi frame
    scene.events.on(Phaser.Scenes.Events.UPDATE, updateListener);

    // 4. QUAN TRỌNG: Dọn dẹp khi chuyển màn chơi
    // Nếu không có đoạn này, khi chuyển Scene, cái updateListener vẫn chạy ngầm -> Gây lỗi hoặc tốn RAM
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.events.off(Phaser.Scenes.Events.UPDATE, updateListener);
        debugText.destroy();
    });
}