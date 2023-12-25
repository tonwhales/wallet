import { Address } from "@ton/core";

const Img_EXMO = require('@assets/known/exmo.png');
const Img_Foundation = require('@assets/known/foundation.png');
const Img_Whales = require('@assets/known/ic_nominators.webp');
const Img_OKX = require('@assets/known/okx.png');
const Img_FTX = require('@assets/known/ftx.png');
const Img_Disintar = require('@assets/known/disintar_logo.png');
const Img_Neocrypto = require('@assets/known/neocrypto.png');

const Img_TonTake = require('@assets/known/Img_TonTake.jpg');

// Tegro
const Img_Tegro_Money_bot = require('@assets/known/Tegro_Money_bot.webp');
const Img_Tegro_TON_bot = require('@assets/known/Tegro_TON_bot.png');

// NFT
const Img_tonwhalesNFT = require('@assets/known/tonwhalesNFT.png');

const Img_kingyTON = require('@assets/known/kingyTON.webp');
const Img_kingyru = require('@assets/known/kingyru.png');
const Img_thetrixter = require('@assets/known/thetrixter.jpg');

const Img_Web3TON = require('@assets/known/Web3TON.webp');
const Img_TONLab_Pro_Inc = require('@assets/known/TONLab_Pro_Inc.webp');

const Img_TON_Chuwee_Boys = require('@assets/known/TON_Chuwee_Boys.webp');

const Img_TON_DUCKS = require('@assets/known/TON_DUCKS.jpeg')

const Img_venera = require('@assets/known/Img_venera.jpeg');

const Img_Team_1 = require('@assets/known/ic_team_1.png');
const Img_Team_2 = require('@assets/known/ic_team_2.png');
const Img_ePN_1 = require('@assets/known/ic_epn_1.png');
const Img_ePN_2 = require('@assets/known/ic_epn_2.png');
const Img_Lockups_1 = require('@assets/known/ic_lockups_1.png');
const Img_Lockups_2 = require('@assets/known/ic_lockups_2.png');

const Img_MEXC = require('@assets/known/ic_mexc.png');

export type KnownWallet = { name: string, ic?: any, colors?: { primary: string, secondary: string } };

export const KnownWallets: (isTestnet: boolean) => { [key: string]: KnownWallet } = (isTestnet: boolean) => {
    return isTestnet
        ? {
            [Address.parse('kQDV1LTU0sWojmDUV4HulrlYPpxLWSUjM6F3lUurMbwhales').toString({ testOnly: isTestnet })]: {
                name: 'Nominators 1',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('kQCkXp5Z3tJ_eAjFG_0xbbfx2Oh_ESyY6Nk56zARZDwhales').toString({ testOnly: isTestnet })]: {
                name: 'Nominators 2',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('kQDBKeGhu9nkQ6jDqkBM9PKxBhGPLEK9Zzj-R2eP8jXK-8Pk').toString({ testOnly: isTestnet })]: {
                name: 'Test KOTE',
                colors: {
                    primary: '#3595D3',
                    secondary: '#BAD5E7'
                }
            }
        } : {
            [Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N').toString()]: {
                name: 'TON Foundation',
                colors: {
                    primary: '#3595D3',
                    secondary: '#BAD5E7'
                },
                ic: Img_Foundation
            },
            [Address.parse('EQABMMdzRuntgt9nfRB61qd1wR-cGPagXA3ReQazVYUNrT7p').toString()]: {
                name: 'EXMO Deposit',
                colors: {
                    primary: '#2679CD',
                    secondary: '#DEEFFC'
                },
                ic: Img_EXMO
            },
            [Address.parse('EQB5lISMH8vLxXpqWph7ZutCS4tU4QdZtrUUpmtgDCsO73JR').toString()]: {
                name: 'EXMO Withdraw',
                colors: {
                    primary: '#2679CD',
                    secondary: '#DEEFFC'
                },
                ic: Img_EXMO
            },
            [Address.parse('EQCNGVeTuq2aCMRtw1OuvpmTQdq9B3IblyXxnhirw9ENkhLa').toString()]: {
                name: 'EXMO Cold',
                colors: {
                    primary: '#2679CD',
                    secondary: '#DEEFFC'
                },
                ic: Img_EXMO
            },
            [Address.parse('EQBfAN7LfaUYgXZNw5Wc7GBgkEX2yhuJ5ka95J1JJwXXf4a8').toString()]: {
                name: 'OKX',
                colors: {
                    primary: '#7D7D7D',
                    secondary: '#DCDCDC'
                },
                ic: Img_OKX
            },
            [Address.parse('EQCzFTXpNNsFu8IgJnRnkDyBCL2ry8KgZYiDi3Jt31ie8EIQ').toString()]: {
                name: 'FTX',
                colors: {
                    primary: '#4EB4DB',
                    secondary: '#BEDAE2'
                },
                ic: Img_FTX
            },
            [Address.parse('EQDd3NPNrWCvTA1pOJ9WetUdDCY_pJaNZVq0JMaara-TIp90').toString()]: {
                name: 'FTX 2',
                colors: {
                    primary: '#4EB4DB',
                    secondary: '#BEDAE2'
                },
                ic: Img_FTX
            },
            // Whales
            [Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D').toString()]: {
                name: 'Whales Mining Pool',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales').toString()]: {
                name: 'Whales Nominators 1',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQCY4M6TZYnOMnGBQlqi_nyeaIB1LeBFfGgP4uXQ1VWhales').toString()]: {
                name: 'Whales Nominators 2',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQCOj4wEjXUR59Kq0KeXUJouY5iAcujkmwJGsYX7qPnITEAM').toString()]: {
                name: 'Whales Team 1',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Team_1
            },
            [Address.parse('EQBI-wGVp_x0VFEjd7m9cEUD3tJ_bnxMSp0Tb9qz757ATEAM').toString()]: {
                name: 'Whales Team 2',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Team_2
            },
            [Address.parse('EQBeNwQShukLyOWjKWZ0Oxoe5U3ET-ApQIWYeC4VLZ4tmeTm').toString()]: {
                name: 'Whales Pool Withdraw 1',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQAQwQc4N7k_2q1ZQoTOi47_e5zyVCdEDrL8aCdi4UcTZef4').toString()]: {
                name: 'Whales Pool Withdraw 2',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQDQA68_iHZrDEdkqjJpXcVqEM3qQC9u0w4nAhYJ4Ddsjttc').toString()]: {
                name: 'Whales Pool Withdraw 3',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQCr1U4EVmSWpx2sunO1jhtHveatorjfDpttMCCkoa0JyD1P').toString()]: {
                name: 'Whales Pool Withdraw 4',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQAB_3oC0MH1r4fz1kztk6Nhq9GFQnrBUgObzrhyAXjzzjrc').toString()]: {
                name: 'Whales Pool Withdraw 5',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQDirOvbb6HvbE2TYwfyNtMwkxj97_Onmt32JUZpdrId0JFi').toString()]: {
                name: 'Infinity Mining Pool',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQBwnT1qpisCLHgRMH_B8Wid51tpqXLdoMQEuutSj65hFmNb').toString()]: {
                name: 'Infinity Mining Pool',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Whales
            },
            [Address.parse('EQDrLq-X6jKZNHAScgghh0h1iog3StK71zn8dcmrOj8jPWRA').toString()]: {
                name: 'Disintar.io',
                colors: {
                    primary: '#9579F0',
                    secondary: '#fff3b2'
                },
                ic: Img_Disintar
            },
            [Address.parse('EQBgbag2XqQzAqVn-nuExgREK9aFXRQVa2tYaFpgTOD7HLfv').toString()]: {
                name: 'Neocrypto.net',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_Neocrypto
            },

            // Tegro
            [Address.parse('EQC5VTeQo1K7T0fWJvdiymrjJTUAXVhk3RsZoxzehh0qU4Yo').toString()]: {
                name: 'Tegro Money bot',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_Tegro_Money_bot
            },
            [Address.parse('EQC9hxkJ9YQVhonPhlIMVMjvojVZlz3cSwggy9EsUUgywsRY').toString()]: {
                name: 'Tegro TON bot',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_Tegro_TON_bot
            },


            // NFTs
            [Address.parse('EQDvRFMYLdxmvY3Tk-cfWMLqDnXF_EclO2Fp4wwj33WhlNFT').toString()]: {
                name: 'Whales Club',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_tonwhalesNFT
            },
            [Address.parse('EQC_wH7JVbDd73ggWjkwe_qdSuL96pOmZL1o1Me3_7V0wN3o').toString()]: {
                name: 'kingyTON',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_kingyTON
            },
            [Address.parse('EQAj-RQTlNNwjkuRVYWdfamU0jjvQbH31lkxTw-osulj4oqm').toString()]: {
                name: 'kingyru',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_kingyru
            },
            [Address.parse('EQBMyAnR4icEM6QH7knxpyqi715vhubtX22Y0RD4uWmoIRWd').toString()]: {
                name: 'thetrixter',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_thetrixter
            },
            [Address.parse('EQDcl_WYgxJ-FYUErehXIdWknowUKSy-LzjJ94gudSX9bZuU').toString()]: {
                name: 'Web3TON',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_Web3TON
            },
            [Address.parse('EQBUFfTuiKVivJBNI35fHmDqXHwc2Fy6Eb-RzUI7QWeb3TON').toString()]: {
                name: 'Web3TON',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_Web3TON
            },
            [Address.parse('EQCNyEcHg5I7YR_PhtuPye7yDMs9Imnm22MY5CiZPyCALBA4').toString()]: {
                name: 'Web3TON',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_Web3TON
            },

            [Address.parse('EQDs9dAPQ1I3hee_7WbWnl0pkFX5MgYlrSJ4j8_al_cFhM7I').toString()]: {
                name: 'TONLab.Pro Inc.',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_TONLab_Pro_Inc
            },

            [Address.parse('EQB3qjjd9U3-QXLW1iwxg_AGKZh-yaa8lKJxf-A35bkzD0T4').toString()]: {
                name: 'TON Chuwee Boys',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_TON_Chuwee_Boys
            },

            [Address.parse('EQAPWS7pRUwuTZweLQGV0PuuP3df3OXC5QEtTEL8km5jEAfV').toString()]: {
                name: 'TON DUCKS',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_TON_DUCKS
            },

            [Address.parse('EQAZc8Jh25nuOH0Dx4ZvRKQ7I7ayltKj6_K2iRNodXSrL9-3').toString()]: {
                name: 'TonTake',
                colors: {
                    primary: '#2c3556',
                    secondary: '#7f88b5'
                },
                ic: Img_TonTake
            },

            [Address.parse('EQCOGv_9I544WnSLvuepzG8WetJek-ebNBwQ3-jfjTQYj5UY').toString()]: {
                name: 'VENERA Exchange',
                colors: {
                    primary: '#8c5bd8',
                    secondary: '#20d7e0'
                },
                ic: Img_venera
            },

            [Address.parse('EQBX63RAdgShn34EAFMV73Cut7Z15lUZd1hnVva68SEl7sxi').toString()]: {
                name: 'MEXC',
                colors: {
                    primary: '#16b979',
                    secondary: '#259D68'
                },
                ic: Img_MEXC
            },
            [Address.parse('EQBYtJtQzU3M-AI23gFM91tW6kYlblVtjej59gS8P3uJ_ePN').toString()]: {
                name: 'ePN Partners 1',
                colors: {
                    primary: '#ec557c',
                    secondary: '#E01447'
                },
                ic: Img_ePN_1
            },
            [Address.parse('EQCpCjQigwF27KQ588VhQv9jm_DUuL_ZLY3HCf_9yZW5_ePN').toString()]: {
                name: 'ePN Partners 2',
                colors: {
                    primary: '#ec557c',
                    secondary: '#E01447'
                },
                ic: Img_ePN_2
            },
            [Address.parse('EQDhGXtbR6ejNQucRcoyzwiaF2Ke-5T8reptsiuZ_mLockup').toString()]: {
                name: 'Lockups 1',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Lockups_1
            },
            [Address.parse('EQDg5ThqQ1t9eriIv2HkH6XUiUs_Wd4YmXZeGpnPzwLockup').toString()]: {
                name: 'Lockups 2',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Lockups_2
            },
        }
}

export const KnownJettonMasters: (isTestnet: boolean) => { [key: string]: any } = (isTestnet: boolean) => {
    return !isTestnet
        ? {
            'EQCcLAW537KnRg_aSPrnQJoyYjOZkzqYp6FVmRUvN1crSazV': { /*TODO: add some usefull fields for mapped objects */ },
            'EQB-ajMyi5-WKIgOHnbOGApfckUGbl6tDk3Qt8PKmb-xLAvp': {},
            'EQB0SoxuGDx5qjVt0P_bPICFeWdFLBmVopHhjgfs0q-wsTON': {}, // wsTON
            'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA': {}, // jUSDT
            'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728': {}, // jUSDC
            'EQDo_ZJyQ_YqBzBwbVpMmhbhIddKtRP99HugZJ14aFscxi7B': {}, // jDAI
            'EQDcBkGHmC4pTf34x3Gm05XvepO5w60DNxZ-XT4I6-UGG5L5': {}, // jWBTC
            
            'EQBCFwW8uFUh-amdRmNY9NyeDEaeDYXd9ggJGsicpqVcHq7B': {}, // DHD Coin
            'EQDCJL0iQHofcBBvFBHdVG233Ri2V4kCNFgfRT-gqAd3Oc86': {}, // Fanzee Token
            'EQC-tdRjjoYMz3MXKW4pj95bNZgvRyWwZ23Jix3ph7guvHxJ': {}, // KINGY
            'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE': {}, // SCALE
            'EQBjEw-SOe8yV2kIbGVZGrsPpLTaaoAOE87CGXI2ca4XdzXA': {}, // MARGA
            'EQAQXlWJvGbbFfE8F3oS8s87lIgdovS455IsWFaRdmJetTon': {}, // JetTon
        }
        : {};
}