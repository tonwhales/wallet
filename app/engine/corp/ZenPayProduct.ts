import BN from "bn.js";
import { selector, useRecoilValue } from "recoil";
import { AsyncLock } from "teslabot";
import { AccountState, fetchAccountState } from "../api/holders/fetchAccountState";
import { fetchAccountToken } from "../api/holders/fetchAccountToken";
import { contractFromPublicKey } from "../contractFromPublicKey";
import { Engine } from "../Engine";
import { watchZenPayAccountUpdates } from "./watchZenPayAccountUpdates";
import { storage } from "../../storage/storage";
import { fetchCardsList, fetchCardsPublic } from "../api/holders/fetchCards";
import { AuthWalletKeysType } from "../../components/secure/AuthWalletKeys";
import { warn } from "../../utils/log";
import { HoldersOfflineApp, fetchAppFile } from "../api/holders/fetchAppFile";
import * as FileSystem from 'expo-file-system';

// export const zenPayEndpoint = AppConfig.isTestnet ? 'card-staging.whales-api.com' : 'card.whales-api.com';
export const zenPayEndpoint = 'card-staging.whales-api.com';
export const holdersUrl = storage.getString('zenpay-app-url') ?? 'https://next.zenpay.org';
const currentTokenVersion = 1;

export type ZenPayAccountStatus = { state: 'need-enrolment' } | (AccountState & { token: string })

export type ZenPayCard = {
    id: string,
    address: string,
    state: string,
    balance: BN,
    type: 'virtual' | 'physical',
    card: {
        lastFourDigits: string | null | undefined,
    }
};

export type ZenPayState = {
    accounts: ZenPayCard[],
};

export class ZenPayProduct {
    readonly engine: Engine;
    readonly #status;
    readonly #accountsState;
    readonly #offlineApp;
    readonly #lock = new AsyncLock();
    watcher: null | (() => void) = null;

    constructor(engine: Engine) {
        this.engine = engine;
        this.#status = selector<ZenPayAccountStatus>({
            key: 'zenpay/' + engine.address.toFriendly({ testOnly: this.engine.isTestnet }) + '/status',
            get: ({ get }) => {
                // Check status
                let status: ZenPayAccountStatus = get(this.engine.persistence.zenPayStatus.item(engine.address).atom) || { state: 'need-enrolment' };

                return status;
            }
        });
        this.#accountsState = selector<ZenPayState>({
            key: 'zenpay/' + engine.address.toFriendly({ testOnly: this.engine.isTestnet }) + '/state',
            get: ({ get }) => {
                // Get state
                let state: ZenPayState = get(this.engine.persistence.zenPayState.item(engine.address).atom) || { accounts: [] };
                return state;
            }
        });

        this.#offlineApp = selector<HoldersOfflineApp | null>({
            key: 'holders/' + engine.address.toFriendly({ testOnly: this.engine.isTestnet }) + '/offline',
            get: ({ get }) => {
                // Get state
                let state: HoldersOfflineApp | null = get(this.engine.persistence.holdersOfflineApp.item().atom);
                return state;
            }
        });

        if (storage.getNumber('zenpay-token-version') !== currentTokenVersion) {
            this.cleanup();
        }
        storage.set('zenpay-token-version', currentTokenVersion);
    }

    async enroll(domain: string, authContext: AuthWalletKeysType) {
        let res = await (async () => {
            //
            // Create domain key if needed
            //

            let created = await this.engine.products.keys.createDomainKeyIfNeeded(domain, authContext);
            if (!created) {
                return false;
            }

            // 
            // Check zenpay token cloud value
            // 

            let existing = await this.engine.cloud.readKey('zenpay-jwt');
            if (existing && existing.toString().length > 0) {
                return true;
            } else {
                //
                // Create sign
                //

                let contract = contractFromPublicKey(this.engine.publicKey);
                let signed = this.engine.products.keys.createDomainSignature(domain);
                let token = await fetchAccountToken({
                    address: contract.address.toFriendly({ testOnly: this.engine.isTestnet }),
                    walletConfig: contract.source.backup(),
                    walletType: contract.source.type,
                    time: signed.time,
                    signature: signed.signature,
                    subkey: signed.subkey
                }, this.engine.isTestnet);
                await this.engine.cloud.update('zenpay-jwt', () => Buffer.from(token));
            }

            return true;
        })();

        // Refetch state
        await this.doSync();

        return res;
    }

    useStatus() {
        return useRecoilValue(this.#status);
    }

    useCards() {
        return useRecoilValue(this.#accountsState).accounts;
    }

    useOfflineApp() {
        return useRecoilValue(this.#offlineApp);
    }

    // Update accounts
    async syncAccounts() {
        const targetAccounts = this.engine.persistence.zenPayState.item(this.engine.address);
        try {
            let listRes = await fetchCardsPublic(this.engine.address, this.engine.isTestnet);

            // Clear token on 401 unauthorized response
            if (listRes === null) {
                this.cleanup();
                return;
            }

            if (!listRes) {
                targetAccounts.update((src) => {
                    return {
                        accounts: []
                    };
                });
                return;
            }

            targetAccounts.update((src) => {
                return {
                    accounts: listRes!.map((account) => ({
                        id: account.id,
                        address: account.address,
                        state: account.state,
                        balance: new BN(account.balance),
                        card: account.card,
                        type: 'virtual'
                    }))
                };
            });

        } catch (e) {
            warn(e);
        }
        try {
            let status = this.engine.persistence.zenPayStatus.item(this.engine.address).value;
            if (status && status?.state !== 'need-enrolment') {
                const token = status.token;
                const cards = await fetchCardsList(token);
                this.engine.persistence.zenPayCards.item(this.engine.address).update((src) => {
                    return cards;
                });
            }
        } catch (e) {
            warn(e);
        }
    }

    stopWatching() {
        if (this.watcher) {
            this.watcher();
            this.watcher = null;
        }
    }

    watch(token: string) {
        this.watcher = watchZenPayAccountUpdates(token, () => {
            this.syncAccounts();
        });
    }

    async cleanup() {
        await this.engine.cloud.update('zenpay-jwt', () => Buffer.from(''));
        this.stopWatching();
        this.engine.persistence.zenPayState.item(this.engine.address).update((src) => {
            return null;
        });
        this.engine.persistence.zenPayStatus.item(this.engine.address).update((src) => null);
    }

    async doSync() {
        await this.#lock.inLock(async () => {
            let targetStatus = this.engine.persistence.zenPayStatus.item(this.engine.address);
            let status: ZenPayAccountStatus | null = targetStatus.value;

            // If not enrolled locally
            if (!status || status.state === 'need-enrolment') {
                const existingToken = await this.engine.cloud.readKey('zenpay-jwt');
                if (existingToken && existingToken.toString().length > 0) {
                    let state = await fetchAccountState(existingToken.toString());
                    targetStatus.update((src) => {
                        if (!!state) {
                            return { ...state, token: existingToken.toString() };
                        }
                        return src
                    });
                } else {
                    targetStatus.update((src) => {
                        if (!src) {
                            this.stopWatching();
                            return { state: 'need-enrolment' };
                        }
                        return src;
                    });
                }

                status = targetStatus.value!;
            }

            // Update state from server
            if (status.state !== 'need-enrolment') {
                const token = status.token;

                if (token && token.length > 0) {
                    let account = await fetchAccountState(token);

                    // Clear token on 401 unauthorized response
                    if (account === null) {
                        this.cleanup();
                        return;
                    }

                    // Clear token if no-ref
                    if (account.state === 'no-ref') {
                        await this.engine.cloud.update('zenpay-jwt', () => Buffer.from(''));
                        this.stopWatching();
                        this.engine.persistence.zenPayState.item(this.engine.address).update((src) => {
                            return null;
                        });
                    }

                    targetStatus.update((src) => {
                        if (account?.state === 'no-ref') {
                            return { state: 'need-enrolment' };
                        }
                        if (account?.state === 'need-phone') {
                            if (src?.state !== 'need-phone') {
                                return { ...account, token: token };
                            }
                        }
                        if (account?.state === 'need-kyc') {
                            if (src?.state !== 'need-kyc') {
                                return { ...account, token: token };
                            }
                        }
                        if (account?.state === 'ok') {
                            if (src?.state !== 'ok') {
                                return { ...account, token: token };
                            }
                        }
                        return src;
                    });
                } else {
                    targetStatus.update(() => {
                        return { state: 'need-enrolment' };
                    });
                }
            }

            // Initial sync
            await this.syncAccounts();

            // Start watcher if ready
            if (targetStatus.value?.state === 'ok' && !this.watcher) {
                this.watch(targetStatus.value.token);
            }

            this.syncOfflineApp();
        });
    }

    async downloadAsset(endpoint: string, asset: string): Promise<string> {
        let fsPath = FileSystem.cacheDirectory + 'holders/' + asset;
        let netPath = endpoint + '/' + asset;

        FileSystem.makeDirectoryAsync(fsPath.split('/').slice(0, -1).join('/'), { intermediates: true });

        const stored = await FileSystem.downloadAsync(netPath, fsPath);
        if (!(asset.endsWith('.js') || asset.endsWith('.html') || asset.endsWith('.css'))) {
            return fsPath;
        }
        let file = await FileSystem.readAsStringAsync(stored.uri);
        file = file.replaceAll(
            '{{APP_PUBLIC_URL}}',
            FileSystem.cacheDirectory + 'holders/'
        );
        await FileSystem.writeAsStringAsync(stored.uri, file);

        return fsPath;
    }

    async syncOfflineRes(endpoint: string, app: HoldersOfflineApp) {
        const hasAppDirectory = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'holders');
        if (!hasAppDirectory.exists) {
            await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'holders');
        }

        let uri = null;
        if (true
            && app.routes.length > 0
            && app.routes[0].fileName === 'index.html'
        ) {
            uri = FileSystem.cacheDirectory + 'holders/index.html';
            const stored = await FileSystem.downloadAsync(endpoint + '/resources/index.html', uri);
            uri = stored.uri;
            let file = await FileSystem.readAsStringAsync(uri);
            file = file.replaceAll(
                '{{APP_PUBLIC_URL}}',
                FileSystem.cacheDirectory + 'holders/'
            );
            await FileSystem.writeAsStringAsync(uri, file);
        }

        const assets = app.resources.map(asset => this.downloadAsset(`${endpoint}resources/`, asset));
        const downloadedAssets = await Promise.all(assets);

        return { uri, assets: downloadedAssets };
    }

    async syncOfflineApp() {
        const fetchedApp = await fetchAppFile(holdersUrl);

        if (!fetchedApp) {
            return;
        }

        const stored = this.engine.persistence.holdersOfflineApp.item().value;

        if (stored && stored.version === fetchedApp.version) {
            return;
        }

        if (!stored || stored.version !== fetchedApp.version) {
            try {
                await this.syncOfflineRes(holdersUrl, fetchedApp);
                this.engine.persistence.holdersOfflineApp.item().update((src) => {
                    return fetchedApp;
                });
            } catch (e) {
                warn('Failed to sync offline app');
                return;
            }
        }
    }
}