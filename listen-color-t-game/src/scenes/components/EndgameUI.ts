import Phaser from 'phaser';

export class EndgameUI {
    static createBackground(scene: Phaser.Scene) {
        const w = scene.scale.width;
        const h = scene.scale.height;

        // Banner
        scene.add.image(w / 2, h / 2 - h * 0.12, 'banner_congrat')
            .setOrigin(0.5)
            .setDepth(100)
            .setDisplaySize(w * 0.9, h * 0.9);
    }

    static createAnimatedIcon(scene: Phaser.Scene) {
        const w = scene.scale.width;
        const h = scene.scale.height;

        if (scene.textures.exists('icon')) {
            const icon = scene.add.image(w / 2, h / 2 - 150, 'icon');
            icon.setScale(0.5);
            icon.setDepth(1005);

            scene.tweens.add({
                targets: icon,
                y: icon.y - 10,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
            scene.tweens.add({
                targets: icon,
                angle: { from: -5, to: 5 },
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }
    }

    static createButtons(scene: Phaser.Scene, onRestart: () => void, onExit: () => void) {
        const w = scene.scale.width;
        const h = scene.scale.height;
        const btnScale = Math.min(w, h) / 1280;
        const spacing = 250 * btnScale;

        // Replay Btn
        const replayBtn = scene.add.image(w / 2 - spacing, h / 2 + h * 0.2, 'btn_reset')
            .setOrigin(0.5)
            .setScale(btnScale)
            .setDepth(101)
            .setInteractive({ useHandCursor: true });

        replayBtn.on('pointerdown', onRestart);

        // Exit Btn
        const exitBtn = scene.add.image(w / 2 + spacing, h / 2 + h * 0.2, 'btn_exit')
            .setOrigin(0.5)
            .setScale(btnScale)
            .setDepth(101)
            .setInteractive({ useHandCursor: true });

        exitBtn.on('pointerdown', onExit);

        // Hover effects
        [replayBtn, exitBtn].forEach((btn) => {
            btn.on('pointerover', () => btn.setScale(btnScale * 1.1));
            btn.on('pointerout', () => btn.setScale(btnScale));
        });
    }

    static showDebugOverlay(scene: Phaser.Scene, payload: object, onDismiss: () => void) {
        const w = scene.scale.width;
        const h = scene.scale.height;
        const payloadStr = JSON.stringify(payload, null, 2);

        const debugBg = scene.add.rectangle(w / 2, h / 2, w * 0.8, h * 0.8, 0x000000, 0.9)
            .setDepth(2000)
            .setInteractive();

        const debugText = scene.add.text(w / 2, h / 2, payloadStr, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#00ff00',
            wordWrap: { width: w * 0.7 }
        }).setOrigin(0.5).setDepth(2001);

        debugBg.on('pointerdown', () => {
            debugBg.destroy();
            debugText.destroy();
            onDismiss();
        });
    }
}
