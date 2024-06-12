import { delay } from "teslabot";
import { throttle } from "./throttle";

describe('throttle', () => {
    it('should throttle function calls notImmediate', async () => {
        const func = jest.fn();
        const throttled = throttle(func, 100, true);

        throttled(1);
        throttled(2);
        throttled(3);

        await delay(50);
        expect(func).toBeCalledTimes(0);

        await delay(100);
        expect(func).toBeCalledTimes(1);
        expect(func).toBeCalledWith(3);
    });

    it('should throttle function calls immediate', async () => {
        const func = jest.fn();
        const throttled = throttle(func, 500);

        throttled(1);
        throttled(2);
        throttled(3);
        throttled(4);
        throttled(5);

        await delay(2500);
        expect(func).toBeCalledTimes(2);
        expect(func).toBeCalledWith(5);

        throttled(6);
        expect(func).toBeCalledTimes(3);
        expect(func).toBeCalledWith(6);
        throttled(7);
        throttled(8);
        throttled(9);
        throttled(10);


        await delay(500);
        expect(func).toBeCalledWith(10);;
    });
});