import { Address } from "@ton/core";
import axios from "axios";
import { whalesConnectEndpoint } from "../clients";
import { JettonTransfer } from "../hooks/transactions/useJettonTransactions";

export async function fetchJettonTransactions(address: Address | string, master: Address | string, isTestnet: boolean, params: { lt?: string, hash?: string, limit?: number }) {
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
    const masterString = typeof master === 'string' ? master : master.toString({ testOnly: isTestnet });
    const url = `${whalesConnectEndpoint}/jettons/wallet/transactions`;
    const body = {
        master: masterString,
        address: addressString,
        isTestnet,
        limit: params.limit,
        beforeLt: params.lt
    }

    const res = await axios.post(url, body);

    if (res.status === 200) {
        return res.data as JettonTransfer[];
    }

    throw new Error(`Invalid response status: ${res.status} for ${addressString}`);
}