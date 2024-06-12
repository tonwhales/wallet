export function throttleDebounce(
    func: (...args: any[]) => void,
    wait: number,
    notImmediate: boolean = false
) {
    let timer: NodeJS.Timeout | null;
    let lastArgs: any[] | null = null;
    let calledOnce = false;

    return function (this: any, ...args: any[]) {
        if (timer) {
            lastArgs = args;
            return;
        }

        if (!calledOnce && !notImmediate) {
            func.apply(this, args);
            calledOnce = true;
        } else {
            lastArgs = args;
        }

        // set the timer to apply new arguments after the wait time
        timer = setTimeout(() => {
            if (lastArgs) {
                func.apply(this, lastArgs);
                lastArgs = null;
            }
            timer = null;
        }, wait);
    };
}