import axios from "axios";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import * as t from 'io-ts';
import { imagePreview } from "../api/fetchAppData";
import { isLeft } from "fp-ts/lib/Either";
import { JettonMasterState } from "../sync/startJettonMasterSync";

const masterContentCodec = t.type({
    name: t.union([t.string, t.null]),
    description: t.union([t.string, t.null]),
    symbol: t.union([t.string, t.null]),
    decimals: t.union([t.number, t.null]),
    originalImage: t.union([t.string, t.null, t.undefined]),
    image: t.union([imagePreview, t.null]),
    amount_style: t.union([
        t.literal('n'),
        t.literal('n-of-total'),
        t.literal('%'),
        t.null,
        t.undefined
    ]),
    render_type: t.union([
        t.literal('currency'),
        t.literal('game'),
        t.null,
        t.undefined
    ]),
});

export async function fetchJettonMasterContent(address: Address) {
    const res = await axios.get(
        `https://connect.tonhubapi.com/jettons/metadata?address=${address.toFriendly({ testOnly: AppConfig.isTestnet })}`,
        { timeout: 5000 }
    );

    if (res.status === 200) {
        const parsed = masterContentCodec.decode(res.data);
        if (isLeft(parsed)) {
            return null;
        }
        return parsed.right as JettonMasterState;
    }

    return null;
}
