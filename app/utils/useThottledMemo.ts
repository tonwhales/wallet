import { DependencyList, useEffect, useMemo, useState } from "react";

export function useThrottledMemo<T>(
    factory: () => T, deps: DependencyList | undefined,
    throttle: number = 1000
): T {
    const [value, setValue] = useState<T>(factory());
    
    useEffect(() => {
        const timer = setTimeout(() => setValue(factory()), throttle);
        return () => clearTimeout(timer);
    }, deps);

    return useMemo(() => value, [value]);
}