import axios from "axios";
import { z } from "zod";

const specialJettonCodec = z.string().nullable().optional();
const knownJettonTickersCodec = z.array(z.string());
const jettonMastersCodec = z.record(z.object({}));

const knownJettonsCodec = z.object({
    tickers: knownJettonTickersCodec,
    specialJetton: specialJettonCodec,
    masters: jettonMastersCodec
});

const knownJettonsNetCodec = z.object({
    testnet: knownJettonsCodec,
    mainnet: knownJettonsCodec,
});

type KnownJettonByNet = z.infer<typeof knownJettonsNetCodec>;

export type KnownJettons = z.infer<typeof knownJettonsCodec>;

export async function fetchKnownJettons(): Promise<KnownJettonByNet | null>{
    try {
        const res = await axios.get("https://raw.githubusercontent.com/tonwhales/wallet/master/assets/knownJettons.json");

        if (res.status === 200) {
            const parsed = knownJettonsNetCodec.safeParse(res.data);

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
