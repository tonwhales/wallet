import axios from "axios";
import { Address } from "@ton/core";
import * as t from 'io-ts';
import { ImagePreview, imagePreview } from "../api/fetchAppData";
import { isLeft } from "fp-ts/lib/Either";

const contentCodec = t.type({
    name: t.union([t.string, t.null]),
    description: t.union([t.string, t.null]),
    symbol: t.union([t.string, t.null]),
    decimals: t.union([t.number, t.null]),
    originalImage: t.union([t.string, t.null, t.undefined]),
    image: t.union([imagePreview, t.null])
});

export type JettonMasterState = {
    version: number;
    name: string | null;
    symbol: string | null;
    image: ImagePreview | null;
    description: string | null;
    originalImage: string | null | undefined;
    decimals: number | null;
}

export async function fetchJettonMasterContent(address: Address, isTestnet: boolean) {
    const res = await axios.get(
        `https://connect.tonhubapi.com/jettons/metadata?address=${address.toString({ testOnly: isTestnet })}`,
        { timeout: 5000 }
    );

    if (res.status === 200) {
        const parsed = contentCodec.decode(res.data);
        if (isLeft(parsed)) {
            return null;
        }
        return parsed.right as JettonMasterState;
    }

    return null;
}
