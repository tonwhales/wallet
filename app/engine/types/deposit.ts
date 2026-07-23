export enum AssetType {
    TON = 'ton',
    HOLDERS = 'holders',
    SPECIAL = 'special',
    OTHERCOINS = 'otherCoins',
    SOLANA = 'solana',
    SOLANA_TOKEN = 'solana-token'
}

export enum Currency {
    UsdTon = 'usdton',
    // App-side id kept as 'ton' after the Gram rebrand: whales-connect maps it to the
    // current Changelly ticker ('gram') for estimate/create, so do NOT "fix" it client-side
    Ton = 'ton',
    Sol = 'sol',
    UsdcSol = 'usdcsol',
    Btc = 'btc',
}