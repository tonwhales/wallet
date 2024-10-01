import murmurhash from 'murmurhash';

export function avatarHash(src: string, count: number) {
    return Math.abs(murmurhash.v3(new TextEncoder().encode(src))) % count;
}