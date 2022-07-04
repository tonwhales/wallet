import { Address } from "ton"
import { AppConfig } from "../AppConfig";

export type StakingPool = { name: string, restricted?: boolean };

export const KnownPools: { [key: string]: StakingPool } = AppConfig.isTestnet
    ? {
        [Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Sandbox Nominators #1',
        },
        [Address.parse('kQDsPXQhe6Jg5hZYATRfYwne0o_RbReMG2P3zHfcFUwHALeS').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Sandbox Nominators #2'
        }
    } : {
        [Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Nominators #1',
        },
        [Address.parse('EQCY4M6TZYnOMnGBQlqi_nyeaIB1LeBFfGgP4uXQ1VWhales').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Nominators #2',
        },
        [Address.parse('EQCOj4wEjXUR59Kq0KeXUJouY5iAcujkmwJGsYX7qPnITEAM').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Team #1',
            restricted: true
        },
        [Address.parse('EQBI-wGVp_x0VFEjd7m9cEUD3tJ_bnxMSp0Tb9qz757ATEAM').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Team #2',
            restricted: true
        },
    }