import { clients } from '../../clients';

export function useClient4(testnet: boolean) {
    return testnet ? clients.ton.testnet : clients.ton.mainnet;
}