export function throttle(
  fn: (...args: any[]) => void,
  delay: number,
  notImmediate: boolean = false
) {
  let waiter: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: any[] | null = null;

  function throttleNextCalls(this: any) {
    if (waiter) {
      return;
    }
    waiter = setTimeout(() => {
      let callArgs = lastArgs;

      lastArgs = null;
      waiter = null;

      // If we have arguments - throttle next calls, else just stop throttling
      if (callArgs) {
        fn.apply(this, callArgs);
        throttleNextCalls();
      }
    }, delay);
  }

  return function (this: any, ...args: any[]) {
    // if we do not have throttling in progress and we need to run leading
    if (!waiter && !notImmediate) {
      fn.apply(this, args);
    } else {
      lastArgs = args;
    }

    throttleNextCalls();
  };
}