import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdleManager } from '../src/utils/IdleManager';

describe('IdleManager', () => {
    let idleManager: IdleManager;
    let mockCallback: any;

    beforeEach(() => {
        mockCallback = vi.fn();
        idleManager = new IdleManager(1000, mockCallback);
    });

    it('should start inactive', () => {
        // Access private property via casting if needed or public method behavior
        // Since we can't access isActive easily without getter, we test behavior
        idleManager.update(2000);
        expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should trigger callback after threshold when started', () => {
        idleManager.start();
        idleManager.update(500);
        expect(mockCallback).not.toHaveBeenCalled();

        idleManager.update(600); // Total 1100 > 1000
        expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should reset timer after triggering', () => {
        idleManager.start();
        idleManager.update(1100);
        expect(mockCallback).toHaveBeenCalledTimes(1);

        idleManager.update(500);
        expect(mockCallback).toHaveBeenCalledTimes(1);

        idleManager.update(600); // 1.1s + 1.1s = 2 triggers? No, timer resets to 0. 
        // 1100 -> trigger, timer=0. 
        // +500 = 500. 
        // +600 = 1100 -> trigger.
        expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should stop counting when stopped', () => {
        idleManager.start();
        idleManager.update(500);
        idleManager.stop();
        idleManager.update(600);
        expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should reset timer when reset() is called', () => {
        idleManager.start();
        idleManager.update(900);
        idleManager.reset();
        idleManager.update(200); // Total 1100 but reset happened
        expect(mockCallback).not.toHaveBeenCalled();
    });
});
