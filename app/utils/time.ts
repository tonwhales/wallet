import { delay, exponentialBackoffDelay } from "teslabot";
import { createLogger, warn } from "./log";

export type BackoffFunc = <T>(tag: string, callback: () => Promise<T>) => Promise<T>;

export function createBackoff(
    opts?: {
        onError?: (tag: string, e: any, failuresCount: number) => void,
        minDelay?: number,
        maxDelay?: number,
        maxFailureCount?: number
    }): BackoffFunc {
    return async <T>(tag: string, callback: () => Promise<T>): Promise<T> => {
        let currentFailureCount = 0;
        const minDelay = opts && opts.minDelay !== undefined ? opts.minDelay : 2000;
        const maxDelay = opts && opts.maxDelay !== undefined ? opts.maxDelay : 5000;
        const maxFailureCount = opts && opts.maxFailureCount !== undefined ? opts.maxFailureCount : 50;
        while (true) {
            try {
                return await callback();
            } catch (e) {
                if (currentFailureCount < maxFailureCount) {
                    currentFailureCount++;
                }
                if (opts && opts.onError) {
                    opts.onError(tag, e, currentFailureCount);
                }
                let waitForRequest = exponentialBackoffDelay(currentFailureCount, minDelay, maxDelay, maxFailureCount);
                await delay(waitForRequest);
            }
        }
    };
}

export function createBackoffFailaible(opts?: {
    onError?: (tag: string, e: any, failuresCount: number) => void;
    minDelay?: number;
    maxDelay?: number;
    maxFailureCount?: number;
    logErrors?: boolean;
}): BackoffFunc {
    return async <T>(tag: string, callback: () => Promise<T>): Promise<T> => {
        let currentFailureCount = 0;
        const minDelay = opts && opts.minDelay !== undefined ? opts.minDelay : 2000;
        const maxDelay = opts && opts.maxDelay !== undefined ? opts.maxDelay : 10000;
        const maxFailureCount = opts && opts.maxFailureCount !== undefined ? opts.maxFailureCount : 50;
        while (true) {
            try {
                return await callback();
            } catch (e) {
                currentFailureCount++;
                if (maxFailureCount == 0 || currentFailureCount === maxFailureCount) {
                    if (opts?.logErrors === true) {
                        warn(tag + ': max failure count reached');
                    }
                    throw e;
                } else {
                    if (opts?.logErrors === true) {
                        warn(tag + ': ' + (e as Error).message);
                    }
                }
                if (opts && opts.onError) {
                    opts.onError(tag, e, currentFailureCount);
                }
                let waitForRequest = exponentialBackoffDelay(currentFailureCount, minDelay, maxDelay, maxFailureCount);
                await delay(waitForRequest);
            }
        }
    };
}

// TODO: mirgate off from backoff to backoffFailaible across the codebase where it's applicable
export const backoffFailaible = createBackoffFailaible({ logErrors: true });
export const backoff = createBackoff({ onError: (tag, e) => createLogger(tag).warn(e.message) });