export interface DebouncedFunc<T extends (...args: any[]) => void> {
    (this: ThisParameterType<T>, ...args: Parameters<T>): void;
    cancel(): void;
}

export function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
): DebouncedFunc<T> {
    let timer: NodeJS.Timeout | null;

    const debouncedFunc = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            func.apply(this, args);
            timer = null;
        }, wait);
    } as DebouncedFunc<T>;

    debouncedFunc.cancel = function () {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };

    return debouncedFunc;
}