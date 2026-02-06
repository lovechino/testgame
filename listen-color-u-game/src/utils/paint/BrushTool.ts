import Phaser from 'phaser';
import { GameConstants } from '../../consts/GameConstants';

export class BrushTool {
    private scene: Phaser.Scene;

    // Config
    private brushColor: number = GameConstants.PAINT.DEFAULT_COLOR;
    private brushSize: number = GameConstants.PAINT.BRUSH_SIZE;
    private readonly brushTexture: string = 'brush_circle';

    // State
    private isErasing: boolean = false;
    private lastX: number = 0;
    private lastY: number = 0;

    // Logic: Map to store used colors per part (Key: ID, Value: Set of colors)
    private partColors: Map<string, Set<number>> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createBrushTexture();
    }

    private createBrushTexture() {
        if (!this.scene.textures.exists(this.brushTexture)) {
            const canvas = this.scene.textures.createCanvas(this.brushTexture, this.brushSize, this.brushSize);
            if (canvas) {
                const ctx = canvas.context;
                const grd = ctx.createRadialGradient(this.brushSize / 2, this.brushSize / 2, 0, this.brushSize / 2, this.brushSize / 2, this.brushSize / 2);
                grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, this.brushSize, this.brushSize);
                canvas.refresh();
            }
        }
    }

    public setColor(color: number) {
        this.isErasing = false;
        this.brushColor = color;
    }

    public setEraser() {
        this.isErasing = true;
    }

    public startStroke(x: number, y: number) {
        this.lastX = x;
        this.lastY = y;
    }

    public getBrushColor(): number {
        return this.brushColor;
    }

    public paint(pointer: Phaser.Input.Pointer, rt: Phaser.GameObjects.RenderTexture) {
        // 1. Get current local coordinates
        const currentX = pointer.x - rt.x;
        const currentY = pointer.y - rt.y;

        // 2. Calculate distance
        const distance = Phaser.Math.Distance.Between(this.lastX, this.lastY, currentX, currentY);

        // Optimization: skip if moved too little
        if (distance < 1) return;

        // 3. LERP Algorithm
        const stepSize = this.brushSize / 4;
        const steps = Math.ceil(distance / stepSize);
        const offset = this.brushSize / 2;

        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const interpX = this.lastX + (currentX - this.lastX) * t;
            const interpY = this.lastY + (currentY - this.lastY) * t;

            if (this.isErasing) {
                rt.erase(this.brushTexture, interpX - offset, interpY - offset);
            } else {
                rt.draw(this.brushTexture, interpX - offset, interpY - offset, 1.0, this.brushColor);
            }
        }

        // Final dot at end position
        if (this.isErasing) {
            rt.erase(this.brushTexture, currentX - offset, currentY - offset);
        } else {
            rt.draw(this.brushTexture, currentX - offset, currentY - offset, 1.0, this.brushColor);

            // Record color usage
            const id = rt.getData('id');
            if (!this.partColors.has(id)) {
                this.partColors.set(id, new Set());
            }
            this.partColors.get(id)?.add(this.brushColor);
        }

        // 4. Update last position
        this.lastX = currentX;
        this.lastY = currentY;
    }

    public getUsedColors(id: string): Set<number> {
        return this.partColors.get(id) || new Set([this.brushColor]);
    }

    public clearUsedColors(id: string) {
        this.partColors.delete(id);
    }
}
