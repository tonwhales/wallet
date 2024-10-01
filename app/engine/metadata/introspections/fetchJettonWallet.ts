import { Address } from "@ton/core";
import { JettonWallet } from "../Metadata";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";

const jettonWalletSchema = z.object({
    balance: z.string(),
    owner: z.string(),
    master: z.string()
});

export async function fetchJettonWallet(seqno: number, address: Address, isTestnet?: boolean): Promise<JettonWallet | null> {
    const query = new URLSearchParams({seqno: seqno.toString()});

    if (isTestnet) {
        query.set('isTestnet', 'true');
    }

    const urlString = `${whalesConnectEndpoint}/jettons/wallet/${address.toString({ testOnly: isTestnet })}`;
    const url = new URL(urlString);
    url.search = query.toString();

    const response = await axios.get(url.toString());

    if (response.status !== 200) {
        return null;
    }

    const parsed = jettonWalletSchema.safeParse(response.data);

    if (!parsed.success) {
        return null;
    }

    return {
        balance: BigInt(parsed.data.balance),
        owner: Address.parse(parsed.data.owner),
        master: Address.parse(parsed.data.master),
        address
    };
}