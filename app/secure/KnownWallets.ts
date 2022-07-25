import { Address } from "ton";
import { AppConfig } from "../AppConfig";

const Img_EXMO = require('../../assets/known/exmo.png');
const Img_Foundation = require('../../assets/known/foundation.png');
const Img_Whales = require('../../assets/known/whales.png');
const Img_OKX = require('../../assets/known/okx.png');
const Img_FTX = require('../../assets/known/ftx.png');
const Img_Disintar = require('../../assets/known/disintar_logo.png');
const Img_Neocrypto = require('../../assets/known/neocrypto.png');

const Img_TonTake = require('../../assets/known/Img_TonTake.jpg');

// Tegro
const Img_Tegro_Money_bot = require('../../assets/known/Tegro_Money_bot.png');
const Img_Tegro_TON_bot = require('../../assets/known/Tegro_TON_bot.png');

// NFT
const Img_tonwhalesNFT = require('../../assets/known/tonwhalesNFT.png');

const Img_kingyTON = require('../../assets/known/kingyTON.png');
const Img_kingyru = require('../../assets/known/kingyru.png');
const Img_thetrixter = require('../../assets/known/thetrixter.jpg');

const Img_Web3TON = require('../../assets/known/Web3TON.jpg');
const Img_TONLab_Pro_Inc = require('../../assets/known/TONLab_Pro_Inc.png');

const Img_TON_Chuwee_Boys = require('../../assets/known/TON_Chuwee_Boys.png');

const Img_TON_DUCKS = require('../../assets/known/TON_DUCKS.jpeg')

const Img_venera = require('../../assets/known/Img_venera.jpeg');

export type KnownWallet = { name: string, ic?: any, colors?: { primary: string, secondary: string } };

export const KnownWallets: { [key: string]: KnownWallet } = AppConfig.isTestnet
    ? {
        [Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Nominators #1',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('kQDsPXQhe6Jg5hZYATRfYwne0o_RbReMG2P3zHfcFUwHALeS').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Nominators #2',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('kQDBKeGhu9nkQ6jDqkBM9PKxBhGPLEK9Zzj-R2eP8jXK-8Pk').toFriendly({ testOnly: AppConfig.isTestnet })]: {
            name: 'Test KOTE',
            colors: {
                primary: '#3595D3',
                secondary: '#BAD5E7'
            }
        }
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
            name: 'Whales Nominators #1',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQCY4M6TZYnOMnGBQlqi_nyeaIB1LeBFfGgP4uXQ1VWhales').toFriendly()]: {
            name: 'Whales Nominators #2',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQCOj4wEjXUR59Kq0KeXUJouY5iAcujkmwJGsYX7qPnITEAM').toFriendly()]: {
            name: 'Whales Team #1',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_Whales
        },
        [Address.parse('EQBI-wGVp_x0VFEjd7m9cEUD3tJ_bnxMSp0Tb9qz757ATEAM').toFriendly()]: {
            name: 'Whales Team #2',
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
        [Address.parse('EQDirOvbb6HvbE2TYwfyNtMwkxj97_Onmt32JUZpdrId0JFi').toFriendly()]: {
            name: 'Infinity Mining Pool',
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
        [Address.parse('EQBgbag2XqQzAqVn-nuExgREK9aFXRQVa2tYaFpgTOD7HLfv').toFriendly()]: {
            name: 'Neocrypto.net',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_Neocrypto
        },

        // Tegro
        [Address.parse('EQC5VTeQo1K7T0fWJvdiymrjJTUAXVhk3RsZoxzehh0qU4Yo').toFriendly()]: {
            name: 'Tegro Money bot',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_Tegro_Money_bot
        },
        [Address.parse('EQC9hxkJ9YQVhonPhlIMVMjvojVZlz3cSwggy9EsUUgywsRY').toFriendly()]: {
            name: 'Tegro TON bot',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_Tegro_TON_bot
        },


        // NFTs
        [Address.parse('EQDvRFMYLdxmvY3Tk-cfWMLqDnXF_EclO2Fp4wwj33WhlNFT').toFriendly()]: {
            name: 'Whales Club',
            colors: {
                primary: '#65C6FF',
                secondary: '#DEEFFC'
            },
            ic: Img_tonwhalesNFT
        },
        [Address.parse('EQC_wH7JVbDd73ggWjkwe_qdSuL96pOmZL1o1Me3_7V0wN3o').toFriendly()]: {
            name: 'kingyTON',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_kingyTON
        },
        [Address.parse('EQAj-RQTlNNwjkuRVYWdfamU0jjvQbH31lkxTw-osulj4oqm').toFriendly()]: {
            name: 'kingyru',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_kingyru
        },
        [Address.parse('EQBMyAnR4icEM6QH7knxpyqi715vhubtX22Y0RD4uWmoIRWd').toFriendly()]: {
            name: 'thetrixter',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_thetrixter
        },
        [Address.parse('EQDcl_WYgxJ-FYUErehXIdWknowUKSy-LzjJ94gudSX9bZuU').toFriendly()]: {
            name: 'Web3TON',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_Web3TON
        },
        [Address.parse('EQCNyEcHg5I7YR_PhtuPye7yDMs9Imnm22MY5CiZPyCALBA4').toFriendly()]: {
            name: 'Web3TON',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_Web3TON
        },

        [Address.parse('EQDs9dAPQ1I3hee_7WbWnl0pkFX5MgYlrSJ4j8_al_cFhM7I').toFriendly()]: {
            name: 'TONLab.Pro Inc.',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_TONLab_Pro_Inc
        },

        [Address.parse('EQB3qjjd9U3-QXLW1iwxg_AGKZh-yaa8lKJxf-A35bkzD0T4').toFriendly()]: {
            name: 'TON Chuwee Boys',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_TON_Chuwee_Boys
        },

        [Address.parse('EQAPWS7pRUwuTZweLQGV0PuuP3df3OXC5QEtTEL8km5jEAfV').toFriendly()]: {
            name: 'TON DUCKS',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_TON_DUCKS
        },

        [Address.parse('EQAZc8Jh25nuOH0Dx4ZvRKQ7I7ayltKj6_K2iRNodXSrL9-3').toFriendly()]: {
            name: 'TonTake',
            colors: {
                primary: '#2c3556',
                secondary: '#7f88b5'
            },
            ic: Img_TonTake
        },
        
        [Address.parse('EQCOGv_9I544WnSLvuepzG8WetJek-ebNBwQ3-jfjTQYj5UY').toFriendly()]: {
            name: 'VENERA Exchange',
            colors: {
                primary: '#8c5bd8',
                secondary: '#20d7e0'
            },
            ic: Img_venera
        },
    }