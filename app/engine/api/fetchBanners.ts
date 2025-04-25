import axios from "axios";
import { Image as ExpoImage } from "expo-image";
import { z } from 'zod';
import { whalesConnectEndpoint } from "../clients";

type BannersRequestParams = {
    version: string,
    buildNumber: string,
    platform: 'ios' | 'android',
    language: string,
}

const productCodec = z.object({
    id: z.string(),
    image: z.string(),
    title: z.string(),
    description: z.string(),
    url: z.string()
});

const bannersResponseCodec = z.object({
    product: productCodec.nullable()
});

export type ProductAd = z.infer<typeof productCodec>;
export type AdsBannersResponse = z.infer<typeof bannersResponseCodec>;

export async function fetchBanners(params: BannersRequestParams) {
    let res = await axios.get(`${whalesConnectEndpoint}/ads/banners`, { params });

    if (res.status !== 200) {
        return null;
    }

    const parsed = bannersResponseCodec.safeParse(res.data);
    if (!parsed.success) {
        return null;
    }

    if (!!parsed.data.product) {
        ExpoImage.prefetch([parsed.data.product.image]);
    }

    return parsed.data;
}