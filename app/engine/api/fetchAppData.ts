import axios from "axios";
import { isLeft } from "fp-ts/lib/Either";
import * as t from 'io-ts';
import { warn } from "../../utils/log";
import qs from 'qs';

export type ImagePreview = {
    blurhash: string,
    preview256: string
}

export const imagePreview = t.type({
    blurhash: t.string,
    preview256: t.string,
});

export type AppData = {
    title: string,
    url: string,
    color: string | null,
    description: string | null,
    image: ImagePreview | null,
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
            blurhash: t.string,
            preview256: t.string,
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

    const reqUrl = `https://connect.tonhubapi.com/apps/metadata?${qs.stringify({ url: url.toString() })}`;
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