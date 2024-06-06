import { sha256_sync } from "@ton/crypto";
import { DependencyList, useEffect, useMemo, useRef, useState } from "react";

function hashObject(obj: any) {
    const str = JSON.stringify(obj);
    const hash = sha256_sync(str);
    return hash.toString('hex');
}

export function useThrottledMemo<T>(
    factory: () => T, deps: DependencyList | undefined,
    throttle: number = 1000
): T {
    const [value, setValue] = useState<T>(factory());
    
    useEffect(() => {
        const timer = setTimeout(() => setValue(factory()), throttle);
        return () => clearTimeout(timer);
    }, deps);

    const ref = useRef(value);
    const prevHash = useRef(hashObject(ref.current));

    return useMemo(() => {
        const a = performance.now();
        const newHash = hashObject(value);
        if (newHash !== prevHash.current) {
            ref.current = value;
            prevHash.current = newHash;
        }
        return ref.current;
    }, [value]);
}