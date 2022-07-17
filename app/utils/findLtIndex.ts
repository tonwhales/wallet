export function findLtIndex(arr: string[], x: string, start: number, end: number): number {
    if (start > end) return -1;
    
    let mid = Math.floor((start + end) / 2);
    
    const midInt = parseInt(arr[mid]);
    const xInt = parseInt(x);
    if (midInt === xInt) return mid;

    if (midInt < xInt)
        return findLtIndex(arr, x, start, mid - 1);
    else
        return findLtIndex(arr, x, mid + 1, end);
}