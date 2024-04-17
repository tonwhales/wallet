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

const Img_Liquid = require('@assets/known/ic_wls.png');
const Img_Telegram = require('@assets/known/ic-telegram.png');
const Img_Fragment = require('@assets/known/ic-fragment.png');
const Img_CryptoBot = require('@assets/known/ic-crypto-bot.png');
const Img_WalletBot = require('@assets/known/ic-wallet-bot.png');
const Img_EXMO_Cold_Storage = require('@assets/known/exmo-cold-storage.png');
const Img_EXMO_Deposit = require('@assets/known/exmo-deposit.png');
const Img_CoinEx = require('@assets/known/coinex.png');
const Img_Huobi = require('@assets/known/huobi.png');
const Img_Tonmobile = require('@assets/known/tonmobile.png');
const Img_Kucoin = require('@assets/known/kucoin.png');
const Img_Lbank = require('@assets/known/lbank-info.png');
const Img_Rocket_Bot = require('@assets/known/rocket-bot.png');
const Img_BitGo = require('@assets/known/bitgo.png');
const Img_BitCom = require('@assets/known/bitcom.png');
const Img_AvanChange = require('@assets/known/avanchange.png');
const Img_FixedFloat = require('@assets/known/fixedfloat.png');

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
            },

            [Address.parse('0QBfAN7LfaUYgXZNw5Wc7GBgkEX2yhuJ5ka95J1JJwXXf2Dz').toString()]: {
                name: 'OKX',
                ic: Img_OKX
            },
            [Address.parse('kQCFTsRSHv1SrUO88ZiOTETr35omrRj6Uav9toX8OzSKXNKY').toString()]: {
                name: 'OKX',
                ic: Img_OKX
            },

        } : {
            [Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N').toString()]: {
                name: 'TON Foundation',
                colors: {
                    primary: '#3595D3',
                    secondary: '#BAD5E7'
                },
                ic: Img_Foundation
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
            [Address.parse('EQB0SoxuGDx5qjVt0P_bPICFeWdFLBmVopHhjgfs0q-wsTON').toString()]: {
                name: 'Whales Liquid',
                colors: {
                    primary: '#65C6FF',
                    secondary: '#DEEFFC'
                },
                ic: Img_Liquid
            },

            // Bridges
            [Address.parse('Ef9NXAIQs12t2qIZ-sRZ26D977H65Ol6DQeXc5_gUNaUys5r').toString()]: { name: 'BSC Bridge' },
            [Address.parse('EQAHI1vGuw7d4WG-CtfDrWqEPNtmUuKjKFEFeJmZaqqfWTvW').toString()]: { name: 'BSC Bridge Collector' },
            [Address.parse('Ef8OvX_5ynDgbp4iqJIvWudSEanWo0qAlOjhWHtga9u2YjVp').toString()]: { name: 'BSC Bridge Governance' },
            [Address.parse('Ef_dJMSh8riPi3BTUTtcxsWjG8RLKnLctNjAM4rw8NN-xWdr').toString()]: { name: 'ETH Bridge' },
            [Address.parse('EQCuzvIOXLjH2tv35gY4tzhIvXCqZWDuK9kUhFGXKLImgxT5').toString()]: { name: 'ETH Bridge Collector' },
            [Address.parse('Ef87m7_QrVM4uXAPCDM4DuF9Rj5Rwa5nHubwiQG96JmyAjQY').toString()]: { name: 'ETH Bridge Governance' },
            [Address.parse('Ef_P2CJw784O1qVd8Qbn8RCQc4EgxAs8Ra-M3bDhZn3OfzRb').toString()]: { name: 'Bridge Oracle 0' },
            [Address.parse('Ef8DfObDUrNqz66pr_7xMbUYckUFbIIvRh1FSNeVSLWrvo1M').toString()]: { name: 'Bridge Oracle 1' },
            [Address.parse('Ef8JKqx4I-XECLuVhTqeY1WMgbgTp8Ld3mzN-JUogBF4ZEW-').toString()]: { name: 'Bridge Oracle 2' },
            [Address.parse('Ef8voAFh-ByCeKD3SZhjMNzioqCmDOK6S6IaeefTwYmRhgsn').toString()]: { name: 'Bridge Oracle 3' },
            [Address.parse('Ef_uJVTTToU8b3o7-Jr5pcUqenxWzDNYpyklvhl73KSIA17M').toString()]: { name: 'Bridge Oracle 4' },
            [Address.parse('Ef93olLWqh1OuBSTOnJKWZ4NwxNq_ELK55_h_laNPVwxcEro').toString()]: { name: 'Bridge Oracle 5' },
            [Address.parse('Ef_iUPZdKLOCrqcNpDuFGNEmiuBwMB18TBXNjDimewpDExgn').toString()]: { name: 'Bridge Oracle 6' },
            [Address.parse('Ef_tTGGToGmONePskH_Y6ZG-QLV9Kcg5DIXeKwBvCX4YifKa').toString()]: { name: 'Bridge Oracle 7' },
            [Address.parse('Ef94L53akPw-4gOk2uQOenUyDYLOaif2g2uRoiu1nv0cWYMC').toString()]: { name: 'Bridge Oracle 8' },
            [Address.parse('EQAtkbV8ysI75e7faO8Ihu0mFtmsg-osj7gmrTg_mljVRccy').toString()]: { name: 'Orbit Bridge TON Vault' },
            [Address.parse('EQB8mNTgoG5QxqhOdVFi6X0MOjkmGNd33ct-RGBT9ZT5oDAX').toString()]: { name: 'Orbit Bridge TON Governance' },
            [Address.parse('EQAihs8RdUgLANjNypV5LgaUHfdoUsMVL5o06K2F-qFSki00').toString()]: { name: 'Orbit Bridge ETH Minter' },
            [Address.parse('EQBbAqI1eVJ8PbZpKXA5njk6hq8Q6ZUxwXLZf-ntG1wf90Tm').toString()]: { name: 'Orbit Bridge ETH Governance' },
            [Address.parse('EQAlMRLTYOoG6kM0d3dLHqgK30ol3qIYwMNtEelktzXP_pD5').toString()]: { name: 'Orbit Bridge KLAYTN Minter' },
            [Address.parse('EQAblz6Xr6b-7eLAWeagIK2Dn-g81YiNpu0okHfc9EwY9_72').toString()]: { name: 'Orbit Bridge KLAYTN Governance' },
            [Address.parse('EQAZPJjpx_VCoaAJW78qYtbUK59IsheysCRgzaSUcp7k_Jqd').toString()]: { name: 'Orbit Bridge POLYGON Minter' },
            [Address.parse('EQBbdymUiXgv2FK4yGwHmXC2mvnpwxUT7U9tj-nonXXnrv0L').toString()]: { name: 'Orbit Bridge POLYGON Governance' },
            [Address.parse('EQA4XgASzx1VSi6T0r8tv1XdHwfUEplQhjg1q09RUd8gcPhd').toString()]: { name: 'Orbit Bridge WEMIX Minter' },
            [Address.parse('EQAj33y_sRp4Ypuz8zdSGfrhYdTgW1uLhjVHuUNBNxnOA1RW').toString()]: { name: 'Orbit Bridge WEMIX Governance' },

            // Celebrities
            [Address.parse('EQAuz15H1ZHrZ_psVrAra7HealMIVeFq0wguqlmFno1f3EJj').toString()]: {
                name: 'Telegram Team',
                ic: Img_Telegram
            },
            [Address.parse('EQBAjaOyi2wGWlk-EDkSabqqnF-MrrwMadnwqrurKpkla9nE').toString()]: {
                name: 'Fragment',
                ic: Img_Fragment
            },
            [Address.parse('EQDYzZmfsrGzhObKJUw4gzdeIxEai3jAFbiGKGwxvxHinaPP').toString()]: {
                name: 'Pavel Durov',
                ic: { uri: 'https://t.me/i/userpic/320/onetimeusername.jpg' }
            },

            // Custodians
            [Address.parse('EQCtiv7PrMJImWiF2L5oJCgPnzp-VML2CAt5cbn1VsKAxLiE').toString()]: {
                name: 'CryptoBot',
                ic: Img_CryptoBot
            },
            [Address.parse('EQDd3NPNrWCvTA1pOJ9WetUdDCY_pJaNZVq0JMaara-TIp90').toString()]: {
                name: 'Wallet Bot',
                ic: Img_WalletBot
            },
            [Address.parse('EQBDanbCeUqI4_v-xrnAN0_I2wRvEIaLg1Qg2ZN5c6Zl1KOh').toString()]: {
                name: 'Wallet Bot',
                ic: Img_WalletBot
            },

            [Address.parse('EQBfAN7LfaUYgXZNw5Wc7GBgkEX2yhuJ5ka95J1JJwXXf4a8').toString()]: {
                name: 'OKX',
                ic: Img_OKX
            },
            [Address.parse('EQCFTsRSHv1SrUO88ZiOTETr35omrRj6Uav9toX8OzSKXGkS').toString()]: {
                name: 'OKX',
                ic: Img_OKX
            },
            [Address.parse('EQABMMdzRuntgt9nfRB61qd1wR-cGPagXA3ReQazVYUNrT7p').toString()]: {
                name: 'EXMO Deposit',
                ic: Img_EXMO_Deposit
            },
            [Address.parse('EQB5lISMH8vLxXpqWph7ZutCS4tU4QdZtrUUpmtgDCsO73JR').toString()]: {
                name: 'EXMO Withdraw',
                ic: Img_EXMO
            },
            [Address.parse('EQCNGVeTuq2aCMRtw1OuvpmTQdq9B3IblyXxnhirw9ENkhLa').toString()]: {
                name: 'EXMO Cold Storage 1',
                ic: Img_EXMO_Cold_Storage
            },
            [Address.parse('EQAmq4rnY6OnwwZ9iCt7Ac1dNyVMuHaPV7akfAACjv_HuO5H').toString()]: {
                name: 'EXMO Cold Storage 2',
                ic: Img_EXMO_Cold_Storage
            },
            [Address.parse('EQA0KjWeODV8CDloEp_d3fBJ71xHMVv77ydQWjVr-fAtZSqw').toString()]: {
                name: 'CoinEx',
                ic: Img_CoinEx
            },
            [Address.parse('EQBVXzBT4lcTA3S7gxrg4hnl5fnsDKj4oNEzNp09aQxkwj1f').toString()]: {
                name: 'Huobi Deposit',
                ic: Img_Huobi
            },
            [Address.parse('EQCFr3jo0DXpIBF82mVGFc3zcdRkSAtinhENPFMQ2FqzYqDB').toString()]: {
                name: 'Huobi',
                ic: Img_Huobi
            },
            [Address.parse('EQDOPNz5UIm3XuXOmCSk_1BvQLdQkMS-lmN8K404sQlyJPrd').toString()]: {
                name: 'TonMobile Service',
                ic: Img_Tonmobile
            },
            [Address.parse('EQCA1BI4QRZ8qYmskSRDzJmkucGodYRTZCf_b9hckjla6dZl').toString()]: {
                name: 'Kucoin',
                ic: Img_Kucoin
            },
            [Address.parse('EQCzflcDPbIdELlQ5hQ7ZYwQw79CW9GTAllgrvfyLbz0_OZs').toString()]: {
                name: 'Kucoin Withdraw',
                ic: Img_Kucoin
            },
            [Address.parse('EQChSx9FI4Wyu5hK0sREHh0jyuBx_fwJbfulPrujtv8dENct').toString()]: {
                name: 'Lbank',
                ic: Img_Lbank
            },
            [Address.parse('EQB1cmpxb3R-YLA3HLDV01Rx6OHpMQA_7MOglhqL2CwJx_dz').toString()]: {
                name: 'Rocket Bot',
                ic: Img_Rocket_Bot
            },
            [Address.parse('EQDB3GVLWYq4TNpPEjcu_tiQfO3wkBhlpYZJCHNz4BscJPaV').toString()]: {
                name: 'xRocket Bot',
                ic: { uri: 'https://static.ton-rocket.com/icons/main_bot.png' }
            },
            [Address.parse('EQAJfclKb4fFi0tWg-PVgwwdXxHRImLWbO9_7HZcpIlCWkTg').toString()]: {
                name: 'BitGo FTX Bankruptcy Custody',
                ic: Img_BitGo
            },
            [Address.parse('EQDD8dqOzaj4zUK6ziJOo_G2lx6qf1TEktTRkFJ7T1c_fPQb').toString()]: { name: 'Bybit' },
            [Address.parse('EQAAi7CI6B441YOCaQEJNWcCfMFXXsdErDVPpO7sMC0WbSVp').toString()]: {
                name: 'bit.com',
                ic: Img_BitCom
            },
            [Address.parse('EQChN26L-fJm7HxrEc5uXNAqm9o2O56oiKLiOdI4NXK8mm96').toString()]: {
                name: 'AvanChange',
                ic: Img_AvanChange
            },
            [Address.parse('EQAYgkeNrvG37SAMu9wgG9TtCyTC5fGkx8Fa6347GnWRk0v_').toString()]: { name: 'Coinone Deposit' },
            [Address.parse('EQCk0gcrHtwTVfx_vuAJW-7HiJotPPqp7c8s6eEoYxq71hcS').toString()]: { name: 'Coinone Withdrawal' },
            [Address.parse('EQDz9O0JE6tVXQI3RQWPGmxVpJ1Idlk8ub2rH3gKmbGFvCuG').toString()]: { name: 'Paribu' },
            [Address.parse('EQD5hzUJ3lovl_eygF9feq-rRH9DyR51HMjvq8bS6gnXimGv').toString()]: { name: 'BingX' },
            [Address.parse('EQDftQdPITnb-x8-gj3f15dtpQbn94F1yYxiftLoQPeGBizQ').toString()]: {
                name: 'FixedFloat',
                ic: Img_FixedFloat
            },
            [Address.parse('EQC0lrj3O0af8GotieYsTXChA_wijIIVN7Sd_wkgYLwoH07q').toString()]: { name: 'Gate.io' },

            // Defi
            [Address.parse('EQCjk1hh952vWaE9bRguFkAhDAL5jj3xj9p0uPWrFBq_GEMS').toString()]: { name: 'Getgems Marketplace' },
            [Address.parse('EQBYTuYbLf8INxFtD8tQeNk5ZLy-nAX9ahQbG_yl1qQ-GEMS').toString()]: { name: 'Getgems Sales' },
            [Address.parse('0:4d695da777df8e1839965cd8a9e928b3b328321ab85dec243e86427ac66edbe8').toString()]: { name: 'OTC Market' },
            [Address.parse('EQAWcJ0nO3WtNlSmUjKcqv4735YCviRqu7LMNJoPXsdHVLC9').toString()]: { name: 'Megaton Finance' },
            [Address.parse('EQAxC3GzQBgjlvW6CJAwgaHvarTfVxo8p7Be_6RMSjsPki6s').toString()]: { name: 'Megaton Finance Dex' },
            [Address.parse('EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt').toString()]: { name: 'STON.fi Dex' },
        }
}

export const KnownJettonMasters: (isTestnet: boolean) => { [key: string]: any } = (isTestnet: boolean) => {
    return !isTestnet
        ? {
            'EQCcLAW537KnRg_aSPrnQJoyYjOZkzqYp6FVmRUvN1crSazV': {}, // AMBR
            'EQB-ajMyi5-WKIgOHnbOGApfckUGbl6tDk3Qt8PKmb-xLAvp': {}, // TNX
            'EQB0SoxuGDx5qjVt0P_bPICFeWdFLBmVopHhjgfs0q-wsTON': {}, // wsTON
            'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA': {}, // jUSDT
            'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728': {}, // jUSDC
            'EQDo_ZJyQ_YqBzBwbVpMmhbhIddKtRP99HugZJ14aFscxi7B': {}, // jDAI
            'EQDcBkGHmC4pTf34x3Gm05XvepO5w60DNxZ-XT4I6-UGG5L5': {}, // jWBTC

            'EQBCFwW8uFUh-amdRmNY9NyeDEaeDYXd9ggJGsicpqVcHq7B': {}, // DHD
            'EQDCJL0iQHofcBBvFBHdVG233Ri2V4kCNFgfRT-gqAd3Oc86': {}, // FNZ
            'EQC-tdRjjoYMz3MXKW4pj95bNZgvRyWwZ23Jix3ph7guvHxJ': {}, // KINGY
            'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE': {}, // SCALE
            'EQBjEw-SOe8yV2kIbGVZGrsPpLTaaoAOE87CGXI2ca4XdzXA': {}, // MARGA
            'EQAQXlWJvGbbFfE8F3oS8s87lIgdovS455IsWFaRdmJetTon': {}, // JETTON
            'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw': {}, // BOLT
            'EQD_KpO2-iFeHPT4dF0ur9E0iAFts2fwhpR2KjwAmYKpccvH': {}, // LIFEYT
            'EQCBdxpECfEPH2wUxi1a6QiOkSf-5qDjUWqLCUuKtD-GLINT': {}, // GLINT
            'EQC47093oX5Xhb0xuk2lCr2RhS8rj-vul61u4W2UH5ORmG_O': {}, // GRAM
        }
        : {
            'kQAZym3GBvem-frRGy1gUIaO-IBb5ByJPrm8aXtN7a_6PK4w': {}, // USDT (j1INCH)
            'EQCSJnVYculwsyLUx_VT3qbIeYUs-nwfPsXjfo9VLYlIQlMJ': {}, // wsTON
            'kQCSJnVYculwsyLUx_VT3qbIeYUs-nwfPsXjfo9VLYlIQuiD': {} // wsTON
        };
}

export const KnownJettonTickers = [
    // Other chains
    'BTC',
    'ETH',
    'BNB',
    'SOL',
    'XPR',
    'ADA',
    'AVAX',
    'DOGE',
    'DOT',
    'TRX',
    'LINK',
    'MATIC',
    'DAI',
    'SHIB',
    'LTC',
    'EURt',
    'EURc',
    'TRX',
    
    // TON main
    'TON',
    'AMBR',
    'wsTON',
    'jUSDT',
    'jUSDC',
    'jDAI',
    'jWBTC',
    
    // TON others
    'TNX',
    'DHD',
    'FNZ',
    'KINGY',
    'SCALE',
    'MARGA',
    'JETTON',
    'BOLT',
    'LIFEYT',
    'GLINT',
    'GRAM',
]
