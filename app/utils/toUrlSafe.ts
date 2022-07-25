export function toUrlSafe(src: string) {
    while (src.indexOf('/') >= 0) {
        src = src.replace('/', '_');
    }
    while (src.indexOf('+') >= 0) {
        src = src.replace('+', '-');
    }
    while (src.indexOf('=') >= 0) {
        src = src.replace('=', '');
    }
    return src;
}