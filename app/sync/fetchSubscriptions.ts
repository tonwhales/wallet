import { Address, fromNano } from "ton";
import { AppConfig } from "../AppConfig";
import { getCurrentAddress } from "../storage/appState";
import { tonClient } from "../utils/client";
import { TupleSlice } from "../utils/TupleSlice";

export interface Subscription {
    address: Address;
}

export interface SubscriptionsStateData {
    updatedAt: number;
    subscriptions: Subscription[];
};

function getSubscribtionAddress(src: any) {
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

export async function fetchSubscriptions(): Promise<SubscriptionsStateData> {
    let address = getCurrentAddress().address;
    const rawRes = await tonClient.callGetMethod(address, 'get_plugin_list', []);

    let parsedRes = new TupleSlice(rawRes.stack);

    let list = parsedRes.readList();

    const res: Subscription[] = [];

    list.forEach((subscribtion: any[]) => {
        let address = getSubscribtionAddress(subscribtion);
        if (address) {
            res.push({ address });
        }
    });

    return {
        updatedAt: Date.now(),
        subscriptions: res,
    };
}