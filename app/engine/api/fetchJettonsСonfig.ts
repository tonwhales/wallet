import axios from "axios";
import { z } from "zod";

const specialJettonCodec = z.string().nullable().optional();
const knownJettonTickersCodec = z.array(z.string());
const jettonMastersCodec = z.record(z.object({}));

const jettonNetConfigCodec = z.object({
    tickers: knownJettonTickersCodec,
    specialJetton: specialJettonCodec,
    masters: jettonMastersCodec
});

const jettonsConfigCodec = z.object({
    testnet: jettonNetConfigCodec,
    mainnet: jettonNetConfigCodec,
});

type JettonsNetConfig = z.infer<typeof jettonsConfigCodec>;

export type JettonsConfig = z.infer<typeof jettonNetConfigCodec>;

export async function fetchJettonsСonfig(): Promise<JettonsNetConfig | null>{
    try {
        const res = await axios.get("https://raw.githubusercontent.com/tonwhales/wallet/master/assets/jettonsConfig.json");

        if (res.status === 200) {
            const parsed = jettonsConfigCodec.safeParse(res.data);

            if (parsed.success) {
                return parsed.data;
            }

            console.warn('Failed to parse jettons config', parsed.error);
        }

        return null;
    } catch {
        console.warn('Failed to parse jettons config');
        return null;
    }
}
