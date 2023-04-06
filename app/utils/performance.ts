export function perf<F>(tag: string, call: () => F): F {
    const t0 = performance.now();
    const res = call();
    console.log(`############## Calling ${tag} took: ${(performance.now() - t0)} milliseconds.`);
    return res;
}