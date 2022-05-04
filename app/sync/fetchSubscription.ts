import BN from "bn.js";
import { Address } from "ton";
import { TupleSlice } from "../utils/TupleSlice";
import { Engine } from "./Engine";
import { parseAddress, Subscription } from "./fetchSubscriptions";

export async function fetchSubscription(engine: Engine, address: Address) {
    const rawRes = await engine.connector.client.callGetMethod(address, 'get_subscription_data', []);
    console.log('[fetchSubscription] raw', JSON.stringify(rawRes));
    let parsedRes = new TupleSlice(rawRes.stack);
    console.log('[fetchSubscription] parsed', JSON.stringify(parsedRes));

    let subscription: Subscription = {
        wallet: parseAddress(parsedRes.readTuple()),
        beneficiary: parseAddress(parsedRes.readTuple()),
        amount: parsedRes.readBigNumber(),
        period: parsedRes.readNumber(),
        startAt: parsedRes.readNumber(), // start_time
        timeout: parsedRes.readNumber(),
        lastPayment: parsedRes.readNumber(), // last_payment_time
        lastRequest: parsedRes.readNumber(), // last_request_time
        failedAttempts: parsedRes.readNumber(),
        subscriptionId: parsedRes.readNumber(),
    };

    return subscription;
}