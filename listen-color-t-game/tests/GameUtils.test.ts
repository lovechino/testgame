import { describe, it, expect, vi } from 'vitest';

// Mock Phaser BEFORE import
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        GameObjects: {
            Image: class { }
        }
    }
}));

import { GameUtils } from '../src/utils/GameUtils';
import Phaser from 'phaser';

// Mock Phaser Scene
const mockScene = {
    scale: {
        width: 800,
        height: 600
    }
} as unknown as Phaser.Scene;

describe('GameUtils', () => {
    it('getW should return scene width', () => {
        expect(GameUtils.getW(mockScene)).toBe(800);
    });

    it('getH should return scene height', () => {
        expect(GameUtils.getH(mockScene)).toBe(600);
    });

    it('pctX should return correct percentage of width', () => {
        expect(GameUtils.pctX(mockScene, 0.5)).toBe(400);
        expect(GameUtils.pctX(mockScene, 0.1)).toBe(80);
    });

    it('pctY should return correct percentage of height', () => {
        expect(GameUtils.pctY(mockScene, 0.5)).toBe(300);
        expect(GameUtils.pctY(mockScene, 0.1)).toBe(60);
    });

    it('centerObj should set position to center', () => {
        const mockObj = {
            setPosition: vi.fn()
        } as unknown as Phaser.GameObjects.Image;

        GameUtils.centerObj(mockScene, mockObj);
        expect(mockObj.setPosition).toHaveBeenCalledWith(400, 300);
    });
});
