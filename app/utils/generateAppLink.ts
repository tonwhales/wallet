import { beginCell } from "ton";
import { AppConfig } from "../AppConfig";
import { toUrlSafe } from "./toUrlSafe";

export function generateAppLink(src: string, customTitle: string | null) {

    let builder = beginCell()
        .storeRef(beginCell()
            .storeBuffer(Buffer.from(src))
            .endCell());
    if (customTitle) {
        builder = builder
            .storeBit(true)
            .storeBit(true)
            .storeBit(false)
            .storeBit(false)
            .storeRef(beginCell()
                .storeBuffer(Buffer.from(customTitle))
                .endCell());
    } else {
        builder = builder
            .storeBit(false);
    }

    return 'https://' + (AppConfig.isTestnet ? 'test.' : '') + 'tonhub.com/app/'
        + toUrlSafe(builder.endCell().toBoc({ idx: false }).toString('base64'));
}