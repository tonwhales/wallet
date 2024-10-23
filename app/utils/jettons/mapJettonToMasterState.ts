import { JettonMasterState } from "../../engine/metadata/fetchJettonMasterContent";
import { Jetton } from "../../engine/types";

export function mapJettonToMasterState(jetton: Jetton, isTestnet: boolean): (JettonMasterState & { address: string }) {
    return {
        address: jetton.master.toString({ testOnly: isTestnet }),
        symbol: jetton.symbol,
        name: jetton.name,
        description: jetton.description,
        decimals: jetton.decimals,
        assets: jetton.assets ?? undefined,
        pool: jetton.pool ?? undefined,
        originalImage: jetton.icon,
        image: jetton.icon ? { preview256: jetton.icon, blurhash: '' } : null,
    }
}