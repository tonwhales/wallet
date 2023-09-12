import { Cell, parseSupportedMessage, resolveKnownInterface, SupportedMessage } from "ton";

export function parseMessageBody(payload: Cell) {
    let res: SupportedMessage | null = null;
    for (let s of []) {
        let known = resolveKnownInterface(s);
        if (known) {
            let r = parseSupportedMessage(known, payload);
            if (r) {
                res = r;
                break;
            }
        }
    }
    return res;
}