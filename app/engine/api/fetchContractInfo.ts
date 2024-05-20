import axios from "axios";
import { z } from "zod";

const contractKindCodec = z.enum(['wallet', 'jetton-wallet', 'jetton-master', 'nft-item', 'card', 'jetton-card']);
const contractInfoCodec = z.object({
    name: z.string(),
    kind: contractKindCodec.optional(),
    version: z.string().optional().nullable(),
}).nullable();

export type ContractInfo = z.infer<typeof contractInfoCodec>;

export async function fetchContractInfo(addressString: string): Promise<ContractInfo> {
    const res = await axios.get(`https://connect.tonhubapi.com/contract/info/${addressString}`);

    if (res.status !== 200) {
        throw new Error(`Invalid response status: ${res.status} for ${addressString}`);
    }

    const contractInfo = contractInfoCodec.safeParse(res.data);

    if (!contractInfo.success) {
        throw new Error(`Invalid response data for ${addressString}`);
    }

    return contractInfo.data;
}