import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { tryFetchLockup } from "../metadata/introspections/tryFetchLockup";
import { startDependentSync } from "./utils/startDependentSync";

export type LockupWalletState = {
    block: number;
    balance: BN;
    wallet: {
        seqno: number;
        subwalletId: number;
        publicKey: Buffer;
        configPublicKey: Buffer;
        allowedDestinations: Address[];
        totalLockedValue: BN;
        locked: Map<string, BN> | null;
        totalRestrictedValue: BN;
        restricted: Map<string, BN> | null;
    } | null
};

export function startLockupWalletSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: AppConfig.isTestnet })}/lockup/wallet`;
    let lite = engine.persistence.liteAccounts.item(address);
    let lockup = engine.persistence.lockupWallets.item(address);

    startDependentSync(key, lite, engine, async (acc) => {

        // Last state
        let src = lockup.value;

        // Check updated
        if (src && src.block >= acc.block) {
            return;
        }

        // Fetch jetton wallet
        let wallet = await tryFetchLockup(engine.client4, acc.block, address);

        // Update state
        let newState: LockupWalletState
        if (!wallet) {
            newState = { block: acc.block, balance: new BN(0), wallet: null };
        } else {
            newState = { block: acc.block, balance: acc.balance, wallet };
        }
        lockup.update(() => newState);
    });
}