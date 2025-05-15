import { Address } from "@ton/core";

export const testnetUSDeMinter = Address.parse('kQCoEng-qFC7XAZBb6oFItzGKjfNg9NbxPwuxbjgH1i_9GKf');
export const testnettsUSDeMinter = Address.parse('kQCjxs2R30ph_enlOOcro5eJIAxSQzYfCXK-2eANSVLV_Ca_');
export const testnetUSDeVaultAddress = Address.parse('kQArivk-3cRZ8Do2iIUbsbcx4Esq91lTljFA9njR2K1LCRZ_');

export const mainnetUSDeMinter = Address.parse('EQAIb6KmdfdDR7CN1GBqVJuP25iCnLKCvBlJ07Evuu2dzP5f');
export const mainnettsUSDeMinter = Address.parse('EQDQ5UUyPHrLcQJlPAczd_fjxn8SLrlNQwolBznxCdSlfQwr');
export const mainnetUSDeVaultAddress = Address.parse('EQChGuD1u0e7KUWHH5FaYh_ygcLXhsdG2nSHPXHW8qqnpZXW');

export const getUSDeMinter = (isTestnet: boolean) => isTestnet ? testnetUSDeMinter : mainnetUSDeMinter;
export const gettsUSDeMinter = (isTestnet: boolean) => isTestnet ? testnettsUSDeMinter : mainnettsUSDeMinter;
export const gettsUSDeVaultAddress = (isTestnet: boolean) => isTestnet ? testnetUSDeVaultAddress : mainnetUSDeVaultAddress;