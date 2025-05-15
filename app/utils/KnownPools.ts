import { Address } from "@ton/core";
import { ImageRequireSource } from "react-native";
import { EthenaAssets, useEthena } from "../engine/hooks/staking/useEthena";

export type StakingPool = {
    name: string,
    restricted?: boolean,
    requireSource?: ImageRequireSource,
    webLink: StakingPoolLink | string
};

export enum StakingPoolLink {
    Club = 'https://tonwhales.com/staking/pool/club',
    Team = 'https://tonwhales.com/staking/pool/team',
    Nominators = 'https://tonwhales.com/staking/pool/nominators',
    Epn = 'https://tonwhales.com/staking/pool/epn',
    Tonkeeper = 'https://tonwhales.com/staking/pool/tonkeeper',
    Liquid = 'https://tonwhales.com/staking/liquid',
    Usde = 'https://ethena.fi'
}

export function getLiquidStakingAddress(isTestnet: boolean) {
    return isTestnet
        ? Address.parse('kQCSJnVYculwsyLUx_VT3qbIeYUs-nwfPsXjfo9VLYlIQuiD')
        : Address.parse('EQB0SoxuGDx5qjVt0P_bPICFeWdFLBmVopHhjgfs0q-wsTON');
}

const knownPoolsTestnet = {
    [Address.parse('kQDV1LTU0sWojmDUV4HulrlYPpxLWSUjM6F3lUurMbwhales').toString({ testOnly: true })]: {
        name: 'Nominators 1',
        requireSource: require('@assets/known/ic_nominators.webp'),
        webLink: StakingPoolLink.Nominators
    },
    [Address.parse('kQCkXp5Z3tJ_eAjFG_0xbbfx2Oh_ESyY6Nk56zARZDwhales').toString({ testOnly: true })]: {
        name: 'Nominators 2',
        requireSource: require('@assets/known/ic_nominators.webp'),
        webLink: StakingPoolLink.Nominators
    },
    [Address.parse('kQCSJnVYculwsyLUx_VT3qbIeYUs-nwfPsXjfo9VLYlIQuiD').toString({ testOnly: true })]: {
        name: 'Whales Liquid',
        requireSource: require('@assets/known/ic_wls.png'),
        webLink: StakingPoolLink.Liquid
    },
}

const knownPoolsMainnet = {
    [Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales').toString()]: {
        name: 'Nominators 1',
        requireSource: require('@assets/known/ic_nominators.webp'),
        webLink: StakingPoolLink.Nominators
    },
    [Address.parse('EQCY4M6TZYnOMnGBQlqi_nyeaIB1LeBFfGgP4uXQ1VWhales').toString()]: {
        name: 'Nominators 2',
        requireSource: require('@assets/known/ic_nominators.webp'),
        webLink: StakingPoolLink.Nominators
    },
    [Address.parse('EQCOj4wEjXUR59Kq0KeXUJouY5iAcujkmwJGsYX7qPnITEAM').toString()]: {
        name: 'Team 1',
        restricted: true,
        requireSource: require('@assets/known/ic_team_1.png'),
        webLink: StakingPoolLink.Team
    },
    [Address.parse('EQBI-wGVp_x0VFEjd7m9cEUD3tJ_bnxMSp0Tb9qz757ATEAM').toString()]: {
        name: 'Team 2',
        restricted: true,
        requireSource: require('@assets/known/ic_team_2.png'),
        webLink: StakingPoolLink.Team
    },
    [Address.parse('EQDFvnxuyA2ogNPOoEj1lu968U4PP8_FzJfrOWUsi_o1CLUB').toString()]: {
        name: 'Club 1',
        restricted: true,
        requireSource: require('@assets/ic_club_cosmos.png'),
        webLink: StakingPoolLink.Club
    },
    [Address.parse('EQA_cc5tIQ4haNbMVFUD1d0bNRt17S7wgWEqfP_xEaTACLUB').toString()]: {
        name: 'Club 2',
        restricted: true,
        requireSource: require('@assets/ic_club_robot.png'),
        webLink: StakingPoolLink.Club
    },
    [Address.parse('EQBYtJtQzU3M-AI23gFM91tW6kYlblVtjej59gS8P3uJ_ePN').toString()]: {
        name: 'ePN Partners 1',
        requireSource: require('@assets/known/ic_epn_1.png'),
        webLink: StakingPoolLink.Epn
    },
    [Address.parse('EQCpCjQigwF27KQ588VhQv9jm_DUuL_ZLY3HCf_9yZW5_ePN').toString()]: {
        name: 'ePN Partners 2',
        requireSource: require('@assets/known/ic_epn_2.png'),
        webLink: StakingPoolLink.Epn
    },
    [Address.parse('EQAA_5_dizuA1w6OpzTSYvXhvUwYTDNTW_MZDdZ0CGKeeper').toString()]: {
        name: 'Tonkeeper 1',
        requireSource: require('@assets/known/ic_tonkeeper_1.png'),
        webLink: StakingPoolLink.Tonkeeper
    },
    [Address.parse('EQDvvBmP3wUcjoXPY1jHfT4-fgb294imVYH5EHdLnAKeeper').toString()]: {
        name: 'Tonkeeper 2',
        requireSource: require('@assets/known/ic_tonkeeper_2.png'),
        webLink: StakingPoolLink.Tonkeeper
    },
    [Address.parse('EQB0SoxuGDx5qjVt0P_bPICFeWdFLBmVopHhjgfs0q-wsTON').toString()]: {
        name: 'Whales Liquid',
        requireSource: require('@assets/known/ic_wls.png'),
        webLink: StakingPoolLink.Liquid
    }
}

export const useKnownPools: (isTestnet: boolean) => { [key: string]: StakingPool } = (isTestnet) => {
    const ethena = useEthena();
    const tsMinter = ethena.tsMinter;
    const webLink = ethena.webLink ?? StakingPoolLink.Usde;
    const pools = isTestnet ? knownPoolsTestnet : knownPoolsMainnet;

    return {
        ...pools,
        [tsMinter.toString({ testOnly: isTestnet })]: {
            name: 'USDe Liquid',
            requireSource: require('@assets/known/ic_usde.png'),
            webLink
        }
    }
}