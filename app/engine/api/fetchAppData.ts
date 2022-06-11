import axios from "axios";
import { isLeft } from "fp-ts/lib/Either";
import * as t from 'io-ts';
import { warn } from "../../utils/log";

export type AppDataIcon = {
    blurhash: string | null,
    preview256: string | null
}

export type AppData = {
    title: string,
    url: string,
    color: string | null,
    description: string | null,
    image: AppDataIcon | null,
    originalImage: string | null
}

export const appDataCodec = t.type({
    title: t.string,
    url: t.string,
    color: t.union([t.null, t.string]),
    description: t.union([t.null, t.string]),
    image: t.union([
        t.null,
        t.type({
            blurhash: t.union([t.null, t.string]),
            preview256: t.union([t.null, t.string]),
        })
    ]),
    originalImage: t.union([t.null, t.string])
});

export async function fetchAppData(link: string) {
    let url: URL
    try {
        url = new URL(link);
    } catch (e) {
        warn(e)
        return null;
    }

    if (link.includes('https://test.tonwhales.com')) {
        url = new URL('https://sandbox.tonwhales.com');
    }
    const reqUrl = `https://connect.tonhubapi.com/apps/metadata?url=${url.toString()}`;
    const res = await axios.get(reqUrl);

    if (res.status === 200) {
        const parsed = appDataCodec.decode(res.data);
        if (isLeft(parsed)) {
            return null;
        }
        return parsed.right as AppData;
    }

    return null;
}