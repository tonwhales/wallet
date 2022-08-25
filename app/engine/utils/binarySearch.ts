import BN from "bn.js";

export function binarySearch(arr: number[] | BN[], element: number | BN, compare: (a: number | BN, b: number | BN) => number) {
    var m = 0;
    var n = arr.length - 1;
    while (m <= n) {
        var k = (n + m) >> 1;
        var cmp = compare(element, arr[k]);
        if (cmp > 0) {
            m = k + 1;
        } else if(cmp < 0) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return -m - 1;
}