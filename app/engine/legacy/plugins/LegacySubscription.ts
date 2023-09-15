import BN from "bn.js";
import { Address } from "@ton/core";

export type LegacySubscription = {
    wallet: Address,
    beneficiary: Address,
    amount: bigint,
    period: number,
    startAt: number,
    timeout: number,
    lastPayment: number,
    lastRequest: number,
    failedAttempts: number,
    subscriptionId: string
};