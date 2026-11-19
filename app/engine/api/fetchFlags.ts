import axios from "axios";
import { whalesConnectEndpoint } from "../clients";
import { flagsCodec, FlagsResponse } from "../flags/flagsCodec";

export type FlagsRequest = {
    network: 'mainnet' | 'testnet';
    addresses: string[];
    appVersion?: string;
    platform: 'ios' | 'android' | 'web';
};

export async function fetchFlags(request: FlagsRequest): Promise<FlagsResponse | null> {
    const res = await axios.post(`${whalesConnectEndpoint}/flags`, request, { timeout: 5000 });

    const parsed = flagsCodec.safeParse(res.data);

    return parsed.success ? parsed.data : null;
}
