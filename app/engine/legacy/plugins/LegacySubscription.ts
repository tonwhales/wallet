import BN from "bn.js";
import { Address } from "ton";

export type LegacySubscription = {
    wallet: Address,
    beneficiary: Address,
    amount: BN,
    period: number,
    startAt: number,
    timeout: number,
    lastPayment: number,
    lastRequest: number,
    failedAttempts: number,
    subscriptionId: string
};