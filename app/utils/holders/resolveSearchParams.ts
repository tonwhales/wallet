export function isHoldersUri(url: URL) {
    const path = url.pathname;
    return path.startsWith('/holders');
}

export function resolveSearchParams(uri: string) {
    try {
        const url = new URL(uri);

        if (isHoldersUri(url)) {
            const searchParams = url.searchParams;
            const params = Object.fromEntries(searchParams.entries());
            return params;
        }
    } catch { }
    return {};
}