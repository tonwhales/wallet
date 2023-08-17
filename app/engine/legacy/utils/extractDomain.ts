export function extractDomain(src: string) {
    return new URL(src).host.toLowerCase();
}