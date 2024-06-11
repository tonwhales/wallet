export function throttle(
    func: (...args: any[]) => void,
    wait: number,
    notImmediate: boolean = false
) {
    let timer: NodeJS.Timeout | null;
    let lastArgs: any[] | null = null;

    return function (this: any, ...args: any[]) {
        if (timer) {
            lastArgs = args;
            return;
        }

        // run the function immediately
        func.apply(this, args);
      
        if (!notImmediate) {
            func.apply(this, args);
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