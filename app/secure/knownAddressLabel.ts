import { shortAddress } from "../utils/shortAddress";
import { KnownWallet } from "./KnownWallets";

export function knownAddressLabel(wallet: KnownWallet, friendly?: string) {
    return wallet.name + ` (${shortAddress({ friendly })})`
}