import BN from "bn.js";
import { Address, fromNano } from "ton";
import { AppConfig } from "../AppConfig";
import { getCurrentAddress } from "../storage/appState";
import { TupleSlice } from "../utils/TupleSlice";
import { Engine } from "./Engine";
import { fetchSubscription } from "./fetchSubscription";

export interface Subscription {
    wallet: Address,
    beneficiary: Address,
    amount: BN,
    period: number,
    startAt: number,
    timeout: number,
    lastPayment: number,
    lastRequest: number,
    failedAttempts: number,
    subscriptionId: number,
}

export interface SubscriptionsStateData {
    updatedAt: number;
    subscriptions: Subscription[];
};

export function parseAddress(src: any) {
    let r = src[1].toString('hex');
    while (r.length < 64) {
        r = "0" + r;
    }
    let subAddress = new Address(parseInt(fromNano(src[0])), Buffer.from(r, "hex"));
    return subAddress;
}

export async function fetchSubscriptions(engine: Engine): Promise<SubscriptionsStateData> {
    let address = getCurrentAddress().address;
    const rawRes = await engine.connector.client.callGetMethod(address, 'get_plugin_list', []);

    let parsedRes = new TupleSlice(rawRes.stack);

    let list = parsedRes.readList();

    const subscriptions: Subscription[] = [];

    for (const sub of list) {
        try {
            const address = parseAddress(sub);
            const res = await fetchSubscription(engine, address);
            subscriptions.push(res);
        } catch (error) {
            console.warn(error);
        }        
    }

    return {
        updatedAt: Date.now(),
        subscriptions
    };
}