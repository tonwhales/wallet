import BN from "bn.js";
import { Address, Cell, Contract, TonClient } from "ton";
import axios from "axios";
import { AppConfig } from "../../AppConfig";

export interface ConnectorAccountState {
    balance: BN;
    state: 'active' | 'uninitialized' | 'frozen';
    code: Buffer | null;
    data: Buffer | null;
    timestamp: number;
    lastTransaction: { lt: string, hash: string } | null;
}

export interface ConnectorTransaction {
    utime: number;
    id: { lt: string, hash: string };
    data: string;
}

export interface Connector {
    readonly client: TonClient;
    fetchTransactions(address: Address, from: { lt: string, hash: string }): Promise<ConnectorTransaction[]>;
}

//
// Mainnet Connector
//

export function createSimpleConnector(endpoints: {
    main: string,
    estimate: string,
    sender: string
}): Connector {

    // Client
    const client = new TonClient({ endpoint: endpoints.main + '/jsonRPC' });

    // Fetch transactions
    const fetchTransactions: (address: Address, from: { lt: string, hash: string }) => Promise<ConnectorTransaction[]> = async (address, from) => {
        let res = await axios.get(endpoints.main + '/getTransactions?address=' + address.toFriendly({ testOnly: AppConfig.isTestnet }) + '&limit=' + 20 + '&lt=' + from.lt + '&hash=' + Buffer.from(from.hash, 'base64').toString('hex'), { timeout: 15000 });
        if (!res.data.ok) {
            throw Error('Server error');
        }
        let data = res.data.result as {
            utime: number,
            transaction_id: {
                lt: string,
                hash: string
            },
            data: string
        }[];
        if (!data.find((v) => v.transaction_id.lt == from.lt)) {
            throw Error('Unable to find transaction');
        }

        return data.map((d) => ({
            id: { hash: d.transaction_id.hash, lt: d.transaction_id.lt },
            utime: d.utime,
            data: d.data
        }));
    }

    return {
        client,
        fetchTransactions
    };
}