import axios from "axios";
import FastImage from "react-native-fast-image";
import { z } from 'zod';

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
    let res = await axios.get('https://connect.tonhubapi.com/ads/banners', { params });


    if (res.status !== 200) {
        return null;
    }
    
    const parsed = bannersResponseCodec.safeParse(res.data);
    if (!parsed.success) {
        return null;
    }

    if (!!parsed.data.product) {
        FastImage.preload([{ uri: parsed.data.product.image }]);
    }

    return parsed.data;
}