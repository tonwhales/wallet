export function throttle(
    func: (...args: any[]) => void,
    wait: number
) {
    let timer: NodeJS.Timeout | null;

    return function (this: any, ...args: any[]) {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            func.apply(this, args);
            timer = null;
        }, wait);
    };
}