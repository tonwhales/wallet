import BN from "bn.js";
import { useRecoilValue } from "recoil";
import { AsyncLock } from "teslabot";
import { AccountState, fetchAccountState } from "../api/holders/fetchAccountState";
import { fetchAccountToken } from "../api/holders/fetchAccountToken";
import { contractFromPublicKey } from "../contractFromPublicKey";
import { Engine } from "../Engine";
import { watchHoldersAccountUpdates } from "./watchHoldersAccountUpdates";
import { storage } from "../../storage/storage";
import { fetchCardsList, fetchCardsPublic } from "../api/holders/fetchCards";
import { AuthParams, AuthWalletKeysType } from "../../components/secure/AuthWalletKeys";
import { warn } from "../../utils/log";
import { HoldersOfflineResMap, fetchHoldersResourceMap, holdersOfflineAppCodec } from "../api/holders/fetchAppFile";
import * as FileSystem from 'expo-file-system';
import { fetchCardsTransactions } from "../api/holders/fetchCardsTransactions";

// export const holdersEndpoint = AppConfig.isTestnet ? 'card-staging.whales-api.com' : 'card.whales-api.com';
export const holdersEndpoint = 'card-staging.whales-api.com';
export const holdersUrl = storage.getString('zenpay-app-url') ?? 'https://next.zenpay.org';
const currentTokenVersion = 1;

export type HoldersAccountStatus = { state: 'need-enrolment' } | (AccountState & { token: string })

export function normalizePath(path: string) {
    return path.replaceAll('.', '_');
}

export type HoldersCard = {
    id: string,
    address: string,
    state: string,
    balance: BN,
    type: 'virtual' | 'physical',
    card: {
        lastFourDigits: string | null | undefined,
        productId: string,
        personalizationCode: string,
        provider: string,
        kind: string,
        tzOffset: number
    }
};

export type HoldersState = {
    accounts: HoldersCard[],
};

export class HoldersProduct {
    readonly engine: Engine;
    readonly #lock = new AsyncLock();
    watcher: null | (() => void) = null;
    stableOfflineVersion: string | null = null;

    //TODO: REMOVE THIS, DEV DEMO ONLY
    devUseOffline = storage.getBoolean('dev-tools:use-offline-app');

    constructor(engine: Engine) {
        //TODO: REMOVE THIS, DEV DEMO ONLY
        this.devUseOffline = storage.getBoolean('dev-tools:use-offline-app');
        if (this.devUseOffline === undefined) {
            storage.set('dev-tools:use-offline-app', true);
            this.devUseOffline = true;
        }

        this.engine = engine;

        if (storage.getNumber('zenpay-token-version') !== currentTokenVersion) {
            this.cleanup();
        }
        storage.set('zenpay-token-version', currentTokenVersion);

        this.doSync();
        this.offlinePreFlight();
    }

    async enroll(domain: string, authContext: AuthWalletKeysType, authParams?: AuthParams) {
        let res = await (async () => {
            // Create domain key if needed
            let created = await this.engine.products.keys.createDomainKeyIfNeeded(domain, authContext, undefined, authParams);
            if (!created) {
                return false;
            }

            // Check holders stored token 
            let existing = this.getToken();
            if (existing && existing.toString().length > 0) {
                return true;
            } else {
                // Create signature and fetch token
                let contract = contractFromPublicKey(this.engine.publicKey);
                let signed
                try {
                    signed = this.engine.products.keys.createDomainSignature(domain);
                } catch {
                    throw new Error('Failed to create domain signature');
                }
                try {
                    let token = await fetchAccountToken({
                        address: contract.address.toFriendly({ testOnly: this.engine.isTestnet }),
                        walletConfig: contract.source.backup(),
                        walletType: contract.source.type,
                        time: signed.time,
                        signature: signed.signature,
                        subkey: signed.subkey
                    }, this.engine.isTestnet);

                    this.setToken(token);
                } catch {
                    this.deleteToken();
                    throw new Error('Failed to fetch account token');
                }
            }

            return true;
        })();

        // Refetch state
        await this.doSync();

        return res;
    }

    useStatus() {
        return useRecoilValue(this.engine.persistence.holdersStatus.item(this.engine.address).atom) || { state: 'need-enrolment' };
    }

    useCards() {
        return useRecoilValue(this.engine.persistence.holdersState.item(this.engine.address).atom)?.accounts || [];
    }

    useOfflineApp() {
        return useRecoilValue(this.engine.persistence.holdersOfflineApp.item().atom);
    }

    useHiddenCards() {
        return useRecoilValue(this.engine.persistence.holdersHiddenCards.item(this.engine.address).atom) || [];
    }

    hideCard(id: string) {
        this.engine.persistence.holdersHiddenCards.item(this.engine.address).update((src) => {
            return [...(src ?? []), id];
        });
    }

    showCard(id: string) {
        this.engine.persistence.holdersHiddenCards.item(this.engine.address).update((src) => {
            return (src ?? []).filter((a) => a !== id);
        });
    }

    // Update accounts
    async syncAccounts() {
        const targetAccounts = this.engine.persistence.holdersState.item(this.engine.address);
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
                        type: account.card.kind === 'physical' ? 'physical' : 'virtual'
                    }))
                };
            });

        } catch (e) {
            warn(e);
        }
        try {
            let status = this.engine.persistence.holdersStatus.item(this.engine.address).value;
            if (status && status?.state !== 'need-enrolment') {
                const token = status.token;
                const cards = await fetchCardsList(token);
                this.engine.persistence.holdersCards.item(this.engine.address).update((src) => {
                    return cards;
                });
            }
        } catch (e) {
            warn(e);
        }
    }

    getCardTransactions(id: string) {
        return this.engine.persistence.holdersCardTransactions.item(id).value;
    }

    useCardTransactions(id: string) {
        return useRecoilValue(this.engine.persistence.holdersCardTransactions.item(id).atom);
    }

    async syncCardsTransactions() {
        const status = this.engine.persistence.holdersStatus.item(this.engine.address).value;
        if (!status || status.state !== 'ok') {
            return;
        }
        const cards = this.engine.persistence.holdersCards.item(this.engine.address).value?.accounts;
        if (!cards) {
            return;
        }

        const token = status.token;
        await Promise.all(cards.map(async (card) => {
            const cardRes = await fetchCardsTransactions(token, card.id);
            if (cardRes) {
                this.engine.persistence.holdersCardTransactions.item(card.id).update((src) => {
                    return cardRes;
                });
            }
        }));
    }

    stopWatching() {
        if (this.watcher) {
            this.watcher();
            this.watcher = null;
        }
    }

    watch(token: string) {
        this.watcher = watchHoldersAccountUpdates(token, (event) => {
            if (
                event.type === 'error'
                && event.message === 'invalid_token'
                || event.message === 'state_change'
            ) {
                this.doSync();
            }
            if (event.type === 'accounts_changed' || event.type === 'balance_change' || event.type === 'limits_change') {
                this.syncAccounts();
                this.syncCardsTransactions();
            }
        });
    }

    deleteToken() {
        storage.delete(`holders-jwt-${this.engine.address.toFriendly({ testOnly: this.engine.isTestnet })}`);
    }

    setToken(token: string) {
        storage.set(`holders-jwt-${this.engine.address.toFriendly({ testOnly: this.engine.isTestnet })}`, token);
    }

    getToken() {
        return storage.getString(`holders-jwt-${this.engine.address.toFriendly({ testOnly: this.engine.isTestnet })}`);
    }

    async cleanup() {
        this.deleteToken();
        this.stopWatching();
        this.engine.persistence.holdersState.item(this.engine.address).update((src) => null);
        this.engine.persistence.holdersStatus.item(this.engine.address).update((src) => null);
    }

    async doSync() {
        await this.#lock.inLock(async () => {
            let targetStatus = this.engine.persistence.holdersStatus.item(this.engine.address);
            let status: HoldersAccountStatus | null = targetStatus.value;

            // If not enrolled locally
            if (!status || status.state === 'need-enrolment') {
                const existingToken = this.getToken();
                if (existingToken && existingToken.length > 0) {
                    let state = await fetchAccountState(existingToken);
                    targetStatus.update((src) => {
                        if (!!state) {
                            return { ...state, token: existingToken };
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
                        this.deleteToken();
                        this.stopWatching();
                        this.engine.persistence.holdersState.item(this.engine.address).update((src) => {
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
            await this.syncCardsTransactions();

            // Start watcher if ready
            if (targetStatus.value?.state === 'ok' && !this.watcher) {
                this.watch(targetStatus.value.token);
            }
        });
    }

    async downloadAsset(endpoint: string, asset: string, version: string): Promise<string> {
        let fsPath = FileSystem.documentDirectory + `holders${version}/` + asset;
        let netPath = endpoint + '/' + asset;

        await FileSystem.makeDirectoryAsync(fsPath.split('/').slice(0, -1).join('/'), { intermediates: true });
        await FileSystem.downloadAsync(netPath, fsPath);

        return fsPath;
    }

    async syncOfflineRes(endpoint: string, resMap: HoldersOfflineResMap) {
        const normalizedVersion = normalizePath(resMap.version);
        const hasAppDirectory = await FileSystem.getInfoAsync(FileSystem.documentDirectory + `holders${normalizedVersion}`);
        if (!hasAppDirectory.exists) {
            await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + `holders${normalizedVersion}`, { intermediates: true });
        }

        let uri = null;
        if (resMap.routes.length > 0 && resMap.routes[0].fileName === 'index.html') {
            uri = FileSystem.documentDirectory + `holders${normalizedVersion}/index.html`;
            await FileSystem.downloadAsync(endpoint + '/app-cache/index.html', uri);
        }

        const assets = resMap.resources.map(asset => this.downloadAsset(`${endpoint}/app-cache`, asset, normalizedVersion));
        const downloadedAssets = await Promise.all(assets);

        return { uri, assets: downloadedAssets };
    }

    async syncOfflineApp() {
        const fetchedApp = await fetchHoldersResourceMap(holdersUrl);
        if (!fetchedApp) {
            return;
        }

        const stored = this.engine.persistence.holdersOfflineApp.item().value;
        if (stored && stored.version === fetchedApp.version) {
            return stored.version;
        }

        try {
            await this.syncOfflineRes(holdersUrl, fetchedApp);
            this.engine.persistence.holdersOfflineApp.item().update((prevState) => {
                if (prevState) {
                    this.cleanupPrevOfflineRes(prevState);
                }
                return fetchedApp;
            });
            return fetchedApp;
        } catch {
            warn('Failed to sync offline app');
            return;
        }
    }

    async forceSyncOfflineApp() {
        const fetchedApp = await fetchHoldersResourceMap(holdersUrl);

        if (!fetchedApp) {
            return;
        }

        this.stableOfflineVersion = null;
        try {
            await this.syncOfflineRes(holdersUrl, fetchedApp);
            this.engine.persistence.holdersOfflineApp.item().update((prevState) => {
                if (prevState) {
                    this.cleanupPrevOfflineRes(prevState);
                }
                return fetchedApp;
            });
            this.stableOfflineVersion = fetchedApp.version;
        } catch {
            warn('Failed to sync offline app');
            return;
        }
    }

    getPrevOfflineVersion() {
        const stored = storage.getString('holders-prev-resource-map');
        if (!stored) {
            return null;
        }
        const parsed = JSON.parse(stored);
        if (!holdersOfflineAppCodec.is(parsed)) {
            return null;
        }
        return parsed;
    }

    storePrevOfflineVersion(prev: HoldersOfflineResMap) {
        storage.set('holders-prev-resource-map', JSON.stringify(prev));
    }

    async cleanupPrevOfflineRes(prevResMap: HoldersOfflineResMap) {
        const stored = this.getPrevOfflineVersion();

        this.storePrevOfflineVersion(prevResMap);

        if (!stored) {
            return;
        }

        const appDir = FileSystem.documentDirectory + `holders${normalizePath(stored.version)}`;
        const hasAppDirectory = await FileSystem.getInfoAsync(appDir);
        if (hasAppDirectory.exists) {
            await FileSystem.deleteAsync(appDir, { idempotent: true });
        }
    }

    async cacheOfflineApp() {
        const stored = this.engine.persistence.holdersOfflineApp.item().value;
        if (!stored) {
            return null;
        }

        const appDir = FileSystem.documentDirectory + `holders${normalizePath(stored.version)}/`;
        const cacheDir = FileSystem.cacheDirectory + `holders${normalizePath(stored.version)}/`;

        let lookupStack = [appDir];
        while (lookupStack.length > 0) {
            let next = lookupStack.shift()!;
            let cacheNext = next.replace(appDir, cacheDir);
            await FileSystem.makeDirectoryAsync(cacheNext, { intermediates: true });

            let entryPaths = await FileSystem.readDirectoryAsync(next);
            let entries = await Promise.all(entryPaths.map(a => FileSystem.getInfoAsync(`${next}${a}`)));

            for (let entry of entries) {
                let cacheUri = entry.uri.replace(appDir, cacheDir);
                if (entry.isDirectory) {
                    lookupStack.push(entry.uri);
                } else {
                    if (!(entry.uri.endsWith('.js') || entry.uri.endsWith('.html') || entry.uri.endsWith('.css'))) {
                        await FileSystem.copyAsync({
                            from: entry.uri,
                            to: cacheUri,
                        });
                        continue;
                    }

                    let file = await FileSystem.readAsStringAsync(entry.uri);
                    file = file.replaceAll(
                        '{{APP_PUBLIC_URL}}',
                        cacheDir,
                    );
                    await FileSystem.writeAsStringAsync(cacheUri, file);
                }
            }
        }

        return stored.version;
    }

    async offlinePreFlight() {
        const stored = this.engine.persistence.holdersOfflineApp.item().value;
        if (!stored) {
            await this.syncOfflineApp();
        } else {
            this.syncOfflineApp();
        }

        let version = await this.cacheOfflineApp();
        this.stableOfflineVersion = version;
    }

    async isOfflineAppReady(resMap: HoldersOfflineResMap) {
        const appDir = FileSystem.cacheDirectory + `holders${normalizePath(resMap.version)}/`;
        const hasAppDirectory = await FileSystem.getInfoAsync(appDir);
        if (!hasAppDirectory.exists) {
            return false;
        }

        let lookupStack = [appDir];
        while (lookupStack.length > 0) {
            let next = lookupStack.shift()!;
            let entryPaths = await FileSystem.readDirectoryAsync(next);
            let entries = await Promise.all(entryPaths.map(a => FileSystem.getInfoAsync(`${next}${a}`)));

            for (let entry of entries) {
                if (entry.isDirectory) {
                    lookupStack.push(entry.uri);
                } else {
                    if (!(entry.uri.endsWith('.js') || entry.uri.endsWith('.html') || entry.uri.endsWith('.css'))) {
                        continue;
                    }

                    let file = await FileSystem.readAsStringAsync(entry.uri);
                    if (file.includes('{{APP_PUBLIC_URL}}')) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    async checkCurrentOfflineVersion() {
        const stored = this.engine.persistence.holdersOfflineApp.item().value;
        if (!stored) {
            return null;
        }

        const isReady = await this.isOfflineAppReady(stored);
        if (isReady) {
            return stored.version;
        }

        return null;
    }
}