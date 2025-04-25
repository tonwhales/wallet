import { warn } from "./log";

export function resolveLink(link: string) {
    let resolved: string | null = null;
    try {
        let temp = link;
        if (temp.startsWith('ipfs://')) {
            temp = temp.replace('ipfs://', 'http://whales.infura-ipfs.io/ipfs/');
        }
        new URL(temp);
        resolved = temp;
    } catch (e) {
        warn(`resolveLink error: ${e}`);
    }
    return resolved;
}