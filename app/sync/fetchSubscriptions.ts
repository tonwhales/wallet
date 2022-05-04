import { Address, fromNano } from "ton";
import { AppConfig } from "../AppConfig";
import { getCurrentAddress } from "../storage/appState";
import { TupleSlice } from "../utils/TupleSlice";
import { Engine } from "./Engine";

export interface Subscription {
    address: Address;
}

export interface SubscriptionsStateData {
    updatedAt: number;
    subscriptions: Subscription[];
};

function getsubscriptionAddress(src: any) {
    try {
        let r = src[1].toString('hex');
        while (r.length < 64) {
            r = "0" + r;
        }
        let subAddress = new Address(parseInt(fromNano(src[0])), Buffer.from(r, "hex"));
        return subAddress;
    } catch (error) {
        console.warn(error);
        return null;
    }
}

export async function fetchSubscriptions(engine: Engine): Promise<SubscriptionsStateData> {
    let address = getCurrentAddress().address;
    const rawRes = await engine.connector.client.callGetMethod(address, 'get_plugin_list', []);

    let parsedRes = new TupleSlice(rawRes.stack);

    let list = parsedRes.readList();

    const res: Subscription[] = [];

    list.forEach((subscription: any[]) => {
        let address = getsubscriptionAddress(subscription);
        if (address) {
            res.push({ address });
        }
    });

    return {
        updatedAt: Date.now(),
        subscriptions: res,
    };
}