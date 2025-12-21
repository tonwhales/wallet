export type WalletExportEntry = {
    name: string;
    address: string;
    mnemonic: string;
};

export type WalletExportData = {
    version: 1;
    wallets: WalletExportEntry[];
};

export type PGPKeyPair = {
    publicKey: string;
    privateKey: string;
    passphrase: string;
};
