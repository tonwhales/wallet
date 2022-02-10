import BN from "bn.js";
import { Address, Cell, Contract, TonClient } from "ton";
import { InvalidateSync } from "teslabot";
import axios from "axios";
import { AppConfig } from "../AppConfig";

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

    sendExternalMessage(contract: Contract, src: Cell): Promise<void>;
    estimateExternalMessageFee(contract: Contract, src: Cell): Promise<BN>;
}

//
// Mainnet Connector
//

export function createSimpleConnector(endpoints: {
    main: string,
    estimate?: string,
    sender?: string
}): Connector {

    // Client
    const client = new TonClient({ endpoint: endpoints.main + '/jsonRPC' });
    const senderClient = new TonClient({ endpoint: (endpoints.sender || endpoints.main) + '/jsonRPC' });
    const estimateClient = new TonClient({ endpoint: (endpoints.estimate || endpoints.main) + '/jsonRPC' });

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
        let res = await axios.get(endpoints.main + '/getTransactions?address=' + address.toFriendly({ testOnly: AppConfig.isTestnet }) + '&limit=' + 20 + '&lt=' + from.lt + '&hash=' + Buffer.from(from.hash, 'base64').toString('hex'));
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

    // Send
    const sendExternalMessage: (contract: Contract, src: Cell) => Promise<void> = (contract, src) => {
        return senderClient.sendExternalMessage(contract, src);
    };

    const estimateExternalMessageFee: (contract: Contract, src: Cell) => Promise<BN> = async (contract, src) => {
        const deployed = await client.isContractDeployed(contract.address);
        const fees = await estimateClient.estimateExternalMessageFee(contract.address, {
            body: src,
            initCode: !deployed ? contract.source.initialCode : null,
            initData: !deployed ? contract.source.initialData : null,
            ignoreSignature: true
        });
        let fee = new BN(0);
        fee = fee.add(new BN(fees.source_fees.fwd_fee));
        fee = fee.add(new BN(fees.source_fees.gas_fee));
        fee = fee.add(new BN(fees.source_fees.in_fwd_fee));
        fee = fee.add(new BN(fees.source_fees.storage_fee));
        return fee;
    }


    return {
        client,
        fetchAccountState,
        watchAccountState,
        fetchTransactions,
        sendExternalMessage,
        estimateExternalMessageFee
    };
}