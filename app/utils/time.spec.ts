import { createBackoffFailaible } from "./time";

describe('backoffFailaible', () => {
    it('should throw on maxFailureCount reached', async () => {
        let backoffFailaible = createBackoffFailaible({ 
            maxFailureCount: 33,
            minDelay: 10,
            maxDelay: 10
        });

        const callback = jest.fn(() => Promise.reject(new Error('test error')));

        await expect(backoffFailaible('test', callback)).rejects.toThrow('test error');
        expect(callback).toHaveBeenCalledTimes(33);

        backoffFailaible = createBackoffFailaible({ 
            maxFailureCount: 1,
            minDelay: 10,
            maxDelay: 10
        });

        await expect(backoffFailaible('test', callback)).rejects.toThrow('test error');
        expect(callback).toHaveBeenCalledTimes(34);
    });

    it('should respect minDelay and maxDelay', async () => {
        let backoffFailaible = createBackoffFailaible({ 
            maxFailureCount: 10,
            minDelay: 10,
            maxDelay: 100
        });

        const callback = jest.fn(() => Promise.reject(new Error('test error')));

        const start = performance.now();

        await expect(backoffFailaible('test', callback)).rejects.toThrow('test error');

        const duration = performance.now() - start;

        expect(duration).toBeGreaterThanOrEqual(10 * 10);
        expect(duration).toBeLessThanOrEqual(100 * 10);
        expect(callback).toHaveBeenCalledTimes(10);
    });
});