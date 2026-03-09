import Phaser from 'phaser';

export class ConfettiManager {
    private scene: Phaser.Scene;
    private confettiEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    start() {
        if (this.confettiEvent) return;

        const width = this.scene.cameras.main.width;
        const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181, 0xaa96da];
        const shapes: Array<'circle' | 'rect'> = ['circle', 'rect'];

        this.confettiEvent = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.scene.scene.isActive()) return;
                for (let i = 0; i < 3; i++) {
                    this.createPiece(
                        Phaser.Math.Between(0, width),
                        -20,
                        Phaser.Utils.Array.GetRandom(colors),
                        Phaser.Utils.Array.GetRandom(shapes)
                    );
                }
            },
            loop: true,
        });
    }

    stop() {
        if (this.confettiEvent) {
            this.confettiEvent.remove(false);
            this.confettiEvent = undefined;
        }
    }

    private createPiece(x: number, y: number, color: number, shape: 'circle' | 'rect') {
        let confetti: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;

        if (shape === 'circle') {
            confetti = this.scene.add.circle(x, y, Phaser.Math.Between(4, 8), color, 1);
        } else {
            confetti = this.scene.add.rectangle(x, y, Phaser.Math.Between(6, 12), Phaser.Math.Between(10, 20), color, 1);
        }

        confetti.setDepth(999);
        confetti.setRotation((Phaser.Math.Between(0, 360) * Math.PI) / 180);

        const duration = Phaser.Math.Between(3000, 5000);
        const targetY = this.scene.cameras.main.height + 50;
        const drift = Phaser.Math.Between(-100, 100);

        this.scene.tweens.add({
            targets: confetti,
            y: targetY,
            x: x + drift,
            rotation: confetti.rotation + Phaser.Math.Between(2, 4) * Math.PI,
            duration,
            ease: 'Linear',
            onComplete: () => confetti.destroy(),
        });

        this.scene.tweens.add({
            targets: confetti,
            alpha: { from: 1, to: 0.3 },
            duration,
            ease: 'Cubic.easeIn',
        });
    }
}
