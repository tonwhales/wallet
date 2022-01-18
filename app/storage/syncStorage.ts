import { Address, Cell } from "ton";
import { storage } from "./storage";

function padLt(src: string) {
    let res = src;
    while (res.length < 20) {
        res = '0' + res;
    }
    return res;
}

export function storeTransaction(address: Address, lt: string, data: string) {
    storage.set('tx_' + address.toFriendly() + '_' + padLt(lt), data);
}

export function loadTransaction(address: Address, lt: string) {
    let data = storage.getString('tx_' + address.toFriendly() + '_' + padLt(lt));
    if (data) {
        return Cell.fromBoc(Buffer.from(data, 'base64'))[0];
    } else {
        return null;
    }
}