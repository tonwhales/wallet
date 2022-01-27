import BN from "bn.js";
import { Address, TonClient } from "ton";
import { InvalidateSync } from "teslabot";
import axios from "axios";

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
    fetchAccountState(address: Address): Promise<ConnectorAccountState>;
    watchAccountState(address: Address, handler: (state: ConnectorAccountState) => Promise<void> | void): () => void;
    fetchTransactions(address: Address, from: { lt: string, hash: string }): Promise<ConnectorTransaction[]>;
}

//
// Mainnet Connector
//

export function createSimpleConnector(endpoint: string): Connector {

    // Client
    const client = new TonClient({ endpoint: endpoint + '/jsonRPC' });

    // Account state
    const fetchAccountState: (address: Address) => Promise<ConnectorAccountState> = async (address) => {
        const state = await client.getContractState(address);
        return {
            balance: state.balance,
            state: state.state,
            code: state.code,
            data: state.data,
            timestamp: state.timestampt,
            lastTransaction: state.lastTransaction
        };
    };

    // Account state watch
    const watchAccountState: (address: Address, handler: (state: ConnectorAccountState) => Promise<void> | void) => () => void = (address, handler) => {
        let ended = false;
        const invalidateSync = new InvalidateSync(async () => {
            const state = await fetchAccountState(address);
            if (ended) {
                return;
            }
            await handler(state);
        });
        const timer = setInterval(() => {
            invalidateSync.invalidate();
        }, 1000);
        return () => {
            if (!ended) {
                ended = true;
                clearInterval(timer);
            }
        }
    }

    // Fetch transactions
    const fetchTransactions: (address: Address, from: { lt: string, hash: string }) => Promise<ConnectorTransaction[]> = async (address, from) => {
        let res = await axios.get(endpoint + '/getTransactions?address=' + address.toFriendly() + '&limit=' + 20 + '&lt=' + from.lt + '&hash=' + Buffer.from(from.hash, 'base64').toString('hex'));
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
        fetchAccountState,
        watchAccountState,
        fetchTransactions
    };
}