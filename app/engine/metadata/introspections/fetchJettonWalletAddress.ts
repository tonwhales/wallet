import { Address } from "@ton/core";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";

const jettonWalletAddressSchema = z.object({ address: z.string() });

export async function fetchJettonWalletAddress(seqno: number, isTestnet: boolean, params: { address: Address, master: Address }): Promise<Address | null> {
    const urlString = `${whalesConnectEndpoint}/jettons/wallet/address`;
    const address = params.address;
    const master = params.master;

    const response = await axios.post(urlString.toString(), {
        address: address.toString({ testOnly: isTestnet }),
        master: master.toString({ testOnly: isTestnet }),
        isTestnet,
        seqno
    });

    if (response.status !== 200) {
        return null;
    }

    const parsed = jettonWalletAddressSchema.safeParse(response.data);

    if (!parsed.success) {
        return null;
    }

    return Address.parse(parsed.data.address);
}