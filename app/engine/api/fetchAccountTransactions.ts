import { Address } from "@ton/core";
import axios from "axios";
import { StoredTransaction } from "../types";

export async function fetchAccountTransactions(address: Address | string, isTestnet: boolean, params?: { lt: string, hash: string }) {
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    const url = `https://connect.tonhubapi.com/transactions/${addressString}`;
    const res = await axios.post(url, params);

    if (res.status === 200) {
        return res.data.transactions as StoredTransaction[];
    }

    throw new Error(`Invalid response status: ${res.status} for ${addressString}`);
}