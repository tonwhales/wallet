import { Address } from "ton"
import { AppConfig } from "../AppConfig";

export type StakingPool = { address: Address, name: string };

export const KnownPools: StakingPool[] = AppConfig.isTestnet ? [{
    name: '[TESTNET] Whales Nominator Pool #2',
    address: Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs')
}] : [{
    name: 'Whales Nominators #1',
    address: Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales')
}];