type ResolverFunction = (...args: any[]) => any;

function memoize<T extends (...args: any[]) => any>(func: T, resolver?: ResolverFunction) {
    if (typeof func !== 'function' || (resolver != null && typeof resolver !== 'function')) {
        throw new TypeError('Expected a function');
    }

    const memoized = (...args: Parameters<T>) => {
        const key = resolver ? resolver(...args) : args[0];
        const cache = memoized.cache;

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = func(...args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
    };

    memoized.cache = new (memoize.Cache || Map)();
    return memoized;
}

memoize.Cache = Map;

export default memoize;