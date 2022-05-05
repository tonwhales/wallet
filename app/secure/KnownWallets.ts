import { ImageSourcePropType } from "react-native";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";

const Img_EXMO = require('../../assets/known/exmo.png');
const Img_Foundation = require('../../assets/known/foundation.png');
const Img_Whales = require('../../assets/known/whales.png');
const Img_OKX = require('../../assets/known/okx.png');
const Img_FTX = require('../../assets/known/ftx.png');
const Img_Disintar = require('../../assets/known/disintar_logo.png');

export type KnownWallet = { name: string, ic?: any, colors?: { primary: string, secondary: string } };

export const KnownWallets: { [key: string]: KnownWallet } = AppConfig.isTestnet
    ? {
        [Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Whales Staking Pool',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
    } : {
        [Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N').toFriendly()]: {
            name: 'TON Foundation',
            colors: {
                primary: '#3595D3',
                secondary: '#BAD5E7'
            },
            ic: Img_Foundation
        },
        [Address.parse('EQABMMdzRuntgt9nfRB61qd1wR-cGPagXA3ReQazVYUNrT7p').toFriendly()]: {
            name: 'EXMO Deposit',
            colors: {
                primary: '#2679CD',
                secondary: '#DEEFFC'
            },
            ic: Img_EXMO
        },
        [Address.parse('EQB5lISMH8vLxXpqWph7ZutCS4tU4QdZtrUUpmtgDCsO73JR').toFriendly()]: {
            name: 'EXMO Withdraw',
            colors: {
                primary: '#2679CD',
                secondary: '#DEEFFC'
            },
            ic: Img_EXMO
        },
        [Address.parse('EQCNGVeTuq2aCMRtw1OuvpmTQdq9B3IblyXxnhirw9ENkhLa').toFriendly()]: {
            name: 'EXMO Cold',
            colors: {
                primary: '#2679CD',
                secondary: '#DEEFFC'
            },
            ic: Img_EXMO
        },
        [Address.parse('EQBfAN7LfaUYgXZNw5Wc7GBgkEX2yhuJ5ka95J1JJwXXf4a8').toFriendly()]: {
            name: 'OKX',
            colors: {
                primary: '#7D7D7D',
                secondary: '#DCDCDC'
            },
            ic: Img_OKX
        },
        [Address.parse('EQCzFTXpNNsFu8IgJnRnkDyBCL2ry8KgZYiDi3Jt31ie8EIQ').toFriendly()]: {
            name: 'FTX',
            colors: {
                primary: '#4EB4DB',
                secondary: '#BEDAE2'
            },
            ic: Img_FTX
        },
        [Address.parse('EQDd3NPNrWCvTA1pOJ9WetUdDCY_pJaNZVq0JMaara-TIp90').toFriendly()]: {
            name: 'FTX 2',
            colors: {
                primary: '#4EB4DB',
                secondary: '#BEDAE2'
            },
            ic: Img_FTX
        },
        // Whales
        [Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D').toFriendly()]: {
            name: 'Whales Mining Pool',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales').toFriendly()]: {
            name: 'Whales Staking Pool',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQBeNwQShukLyOWjKWZ0Oxoe5U3ET-ApQIWYeC4VLZ4tmeTm').toFriendly()]: {
            name: 'Whales Pool Withdraw 1',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQAQwQc4N7k_2q1ZQoTOi47_e5zyVCdEDrL8aCdi4UcTZef4').toFriendly()]: {
            name: 'Whales Pool Withdraw 2',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQDQA68_iHZrDEdkqjJpXcVqEM3qQC9u0w4nAhYJ4Ddsjttc').toFriendly()]: {
            name: 'Whales Pool Withdraw 3',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQCr1U4EVmSWpx2sunO1jhtHveatorjfDpttMCCkoa0JyD1P').toFriendly()]: {
            name: 'Whales Pool Withdraw 4',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQAB_3oC0MH1r4fz1kztk6Nhq9GFQnrBUgObzrhyAXjzzjrc').toFriendly()]: {
            name: 'Whales Pool Withdraw 5',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQDrLq-X6jKZNHAScgghh0h1iog3StK71zn8dcmrOj8jPWRA').toFriendly()]: {
            name: 'Disintar.io',
            colors: {
                primary: '#9579F0',
                secondary: '#fff3b2'
            },
            ic: Img_Disintar
        },
    }