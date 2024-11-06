import { JettonFull } from "../../engine/api/fetchHintsFull";
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

export function mapJettonFullToMasterState(hint: JettonFull): (JettonMasterState & { address: string }) {
    return {
        address: hint.jetton.address,
        symbol: hint.jetton.symbol,
        name: hint.jetton.name,
        decimals: hint.jetton.decimals,
        originalImage: hint.jetton.image,
    }
}