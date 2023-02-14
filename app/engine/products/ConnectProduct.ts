import { Engine } from "../Engine";
import axios from 'axios';
import { createLogger, warn } from '../../utils/log';
import EventSource, { MessageEvent } from 'react-native-sse';
import { ConnectedApp, ConnectedAppConnection, ConnectedAppConnectionRemote, ConnectQrQuery, SignRawParams, TonConnectBridgeType } from '../tonconnect/types';
import { AppRequest, Base64, ConnectEvent, ConnectRequest, DisconnectEvent, hexToByteArray, RpcMethod, SEND_TRANSACTION_ERROR_CODES, SessionCrypto, WalletResponse } from '@tonconnect/protocol';
import { CloudValue } from '../cloud/CloudValue';
import { selector, useRecoilValue } from 'recoil';
import { AppConfig } from '../../AppConfig';
import { AppState } from 'react-native';
import { AppManifest, fetchManifest } from '../tonconnect/fetchManifest';
import { storage } from '../../storage/storage';
import { extensionKey } from './ExtensionsProduct';
import { getTimeSec } from '../../utils/getTimeSec';

let logger = createLogger('tonconnect');

export class ConnectProduct {
    readonly engine: Engine;
    private _destroyed: boolean;
    private readonly bridgeUrl = 'https://bridge.tonapi.io/bridge';
    private readonly defaultTtl = 300;

    readonly extensions: CloudValue<{ installed: { [key: string]: ConnectedApp; } }>;
    readonly #pendingRequestsSelector;
    readonly pendingItem;
    readonly #extensionsSelector;
    private eventSource: EventSource | null = null;
    private connections: ConnectedAppConnectionRemote[] = [];
    private activeRequests: { [from: string]: AppRequest<RpcMethod> } = {};

    constructor(engine: Engine) {
        this.engine = engine;
        this._destroyed = false;
        this.extensions = this.engine.cloud.get('wallet.tonconnect.extensions.v1', (src) => { src.installed = {} });
        this.pendingItem = this.engine.persistence.connectDAppRequests.item();
        this.#pendingRequestsSelector = selector({
            key: 'tonconnect/requests',
            get: ({ get }) => {
                let reqests = get(this.engine.persistence.connectDAppRequests.item().atom);
                console.log('#pendingRequestsSelector', { reqests });
                return reqests ?? [];
            },
            dangerouslyAllowMutability: true
        });
        this.#extensionsSelector = selector({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/tonconnect/extensions',
            get: ({ get }) => {
                let apps = get(this.extensions.atom);
                let res: {
                    key: string,
                    url: string,
                    name: string,
                    image: string | null,
                    termsOfUseUrl: string | null,
                    privacyPolicyUrl: string | null,
                }[] = [];

                console.log('ConnectProduct extensions', { apps });

                for (let k in apps.installed) {
                    let app = apps.installed[k];
                    let key = extensionKey(app.url);

                    this.engine.persistence.connectDApps.each((persistenceKey) => {
                        const data = this.engine.persistence.connectDApps.item(key).value;
                        console.log({ key, persistenceKey, ok: persistenceKey === key, data });
                    });

                    const persisted = this.engine.persistence.connectDApps.item(key).value;

                    console.log({ persisted })

                    if (!persisted) {
                        continue;
                    }

                    console.log('adding', { k });
                    res.push({
                        key: k,
                        url: app.url,
                        name: app.name ?? persisted.name,
                        image: app.icon ?? persisted.iconUrl,
                        privacyPolicyUrl: persisted.privacyPolicyUrl ?? null,
                        termsOfUseUrl: persisted.termsOfUseUrl ?? null
                    });
                }
                return res;
            }
        });
        this._startSync();

        // Refresh on app load
        AppState.addEventListener('change', () => {
            this.extensions.invalidate();
        });
    }

    get ready() {
        return true;
    }

    async awaitReady() {
        // Nothing to do
    }

    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
        }
    }

    close() {
        if (this.eventSource) {
            this.eventSource.removeAllEventListeners();
            this.eventSource.close();
            this.eventSource = null;

            logger.log('sse close');
        }
    }

    async open(connections: ConnectedAppConnection[]) {
        this.close();

        this.connections = connections.filter((item) => item.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[];

        if (this.connections.length === 0) {
            return;
        }

        const walletSessionIds = this.connections.map((item) => new SessionCrypto(item.sessionKeyPair).sessionId).join(',');
        let url = `${this.bridgeUrl}/events?client_id=${walletSessionIds}`;
        const lastEventId = await this.getLastEventId();

        if (lastEventId) {
            url += `&last_event_id=${lastEventId}`;
        }

        this.eventSource = new EventSource(url);

        this.eventSource.addEventListener(
            'message',
            (event) => {
                console.log('eventSource new Message', { event });
                this.handleMessage(event as MessageEvent);
            }
            //   debounce(this.handleMessage.bind(this), 200) as EventSourceListener,
        );


        this.eventSource.addEventListener('open', () => {
            logger.log('sse connect: opened');
        });

        this.eventSource.addEventListener('error', (event) => {
            logger.log('sse connect: error' + JSON.stringify(event));
        });
    }

    private _startSync() {
        const apps = Object.values(this.extensions.value.installed);
        const connections: ConnectedAppConnection[] = []
        for (let app of apps) {
            connections.push(...app.connections);
        }
        this.open(connections);
    }

    usePendingRequests() {
        return useRecoilValue(this.#pendingRequestsSelector);
    }

    useExtensions() {
        return useRecoilValue(this.#extensionsSelector);
    }

    getExtension(key: string) {
        return this.extensions.value.installed[key];
    }

    private async setLastEventId(lastEventId: string) {
        storage.set('connect_last_event_id', lastEventId);
    }

    private async getLastEventId() {
        return storage.getString('connect_last_event_id');
    }

    async send<T extends RpcMethod>({
        response,
        sessionCrypto,
        clientSessionId,
        bridgeUrl,
        ttl
    }: {
        response: WalletResponse<T> | ConnectEvent | DisconnectEvent,
        sessionCrypto: SessionCrypto,
        clientSessionId: string,
        bridgeUrl?: string,
        ttl?: number,
    }): Promise<void> {
        try {
            const url = `${bridgeUrl ?? 'https://bridge.tonapi.io/bridge'}/message?client_id=${sessionCrypto.sessionId}&to=${clientSessionId}&ttl=${ttl || this.defaultTtl}`;

            const encodedResponse = sessionCrypto.encrypt(
                JSON.stringify(response),
                hexToByteArray(clientSessionId),
            );

            await axios.post(url, Base64.encode(encodedResponse));
        } catch (e) {
            logger.warn(e);
        }
    }

    async handleConnectDeeplink(query: ConnectQrQuery) {
        try {
            const protocolVersion = Number(query.v);
            const request = JSON.parse(decodeURIComponent(query.r)) as ConnectRequest;
            const clientSessionId = query.id;

            const manifest = await this.getConnectAppData(request.manifestUrl);

            console.log({ protocolVersion, request, clientSessionId, manifest });

            return ({
                protocolVersion,
                request,
                clientSessionId,
                manifest
            });
        } catch (err) {
            logger.warn(err);
        }
    }

    saveAppConnection(appData: Omit<ConnectedApp, 'connections'>, connection: ConnectedAppConnection) {
        console.log('saveAppConnection', { appData, connection });
        this.extensions.value.installed

        let key = extensionKey(appData.url);

        const connected = this.extensions.value.installed[key];
        if (!!connected) {
            this.extensions.update((doc) => {
                doc.installed[key].connections.push(connection);
            });
            return;
        }
        this.extensions.update((doc) => {
            doc.installed[key] = {
                ...appData,
                connections: connection ? [connection] : [],
            }
        });

        this._startSync();
    }

    removeConnectedApp(url: string) {
        let key = extensionKey(url);

        if (!this.extensions.value.installed[key]) {
            return;
        }
        this.extensions.update((doc) => {
            delete doc.installed[key];
        });

        this._startSync();
    }

    useAppManifest(url: string) {
        return useRecoilValue(this.engine.persistence.connectDApps.item(extensionKey(url)).atom);
    }

    async getConnectAppData(url: string) {
        let key = extensionKey(url);
        const isPersisted = this.engine.persistence.connectManifests.item(key).value;
        console.log('getConnectAppData', { url, key, persisted: isPersisted });
        // fetch and add if does not exist
        if (!isPersisted) {
            try {
                const appData = await fetchManifest(url);
                console.log('fetchManifest', { key, appData })
                if (appData) {
                    this.updateConnectAppData(appData);
                    this.engine.persistence.connectManifests.item(key).update(() => appData.url);
                    return appData;
                }
            } catch (e) {
                warn(e);
                return null;
            }
            return null;
        }
        const stored = this.engine.persistence.connectDApps.item(isPersisted).value;

        if (!stored) {
            try {
                const appData = await fetchManifest(url);
                console.log('fetchManifest', { key, appData })
                if (appData) {
                    this.updateConnectAppData(appData);
                    this.engine.persistence.connectManifests.item(key).update(() => appData.url);
                    return appData;
                }
            } catch (e) {
                warn(e);
                return null;
            }
            return null;
        }

        return stored;
    }

    private updateConnectAppData(appData: AppManifest) {
        let key = extensionKey(appData.url);
        const app = this.engine.persistence.connectDApps.item(key);
        app.update(() => appData);
    }

    findConnectedAppByClientSessionId(clientSessionId: string): { connectedApp: ConnectedApp | null; connection: ConnectedAppConnection | null } {
        const connectedAppsList = Object.values(this.extensions.value.installed);
        let connection: ConnectedAppConnection | null = null;

        const connectedApp = connectedAppsList.find((app) =>
            app.connections.find((item) => {
                if (item.type === TonConnectBridgeType.Remote && item.clientSessionId === clientSessionId) {
                    connection = item;
                    return true;
                }

                return false;
            }),
        );

        return { connectedApp: connectedApp ?? null, connection };
    };

    getConnectedAppByUrl(url: string): ConnectedApp | null {
        const apps = Object.values(this.extensions.value.installed);
        const fixedUrl = url.replace(/\/$/, '');

        return apps.find((app) => fixedUrl.startsWith(app.url.replace(/\/$/, ''))) ?? null;
    };

    async handleSendTransaction(
        request: AppRequest<'sendTransaction'>,
        callback: (response: WalletResponse<'sendTransaction'>) => void,
        from: string
    ) {
        const params = JSON.parse(request.params[0]) as SignRawParams;

        console.log('sendTransaction', { params: JSON.stringify(params) });

        const isValidRequest =
            params && typeof params.valid_until === 'number' &&
            Array.isArray(params.messages) &&
            params.messages.every((msg) => !!msg.address && !!msg.amount);

        if (!isValidRequest) {
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                    message: `Bad request`,
                },
                id: request.id.toString(),
            });
            return;
        }

        const { valid_until } = params;

        if (valid_until < getTimeSec()) {
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                    message: `Request timed out`,
                },
                id: request.id.toString(),
            });
            return;
        }

        const current = this.pendingItem.value ?? [];
        const found = current.find((item) => item.from === from);
        if (found) {
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                    message: `Request already pending`,
                },
                id: request.id.toString(),
            });
            return;
        }

        this.pendingItem.update((doc) => {
            console.log('updating with new pending request', { doc });
            const temp = doc ?? [];
            temp.push({ from: from, id: request.id.toString(), params: request.params, method: 'sendTransaction' });
            console.log('new state', temp);
            return temp;
        });
    }

    private async handleRequest<T extends RpcMethod>(
        request: AppRequest<T>,
        connectedApp: ConnectedApp | null,
        callback: (response: WalletResponse<T>) => void,
        from: string
    ) {
        if (!connectedApp) {
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Unknown app',
                },
                id: request.id.toString(),
            });
        }

        if (request.method === 'sendTransaction') {
            this.handleSendTransaction(request, callback, from);
            return;
        }

        callback({
            error: {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message: `Method "${request.method}" is not supported by the wallet app`,
            },
            id: request.id.toString(),
        });
    }

    async handleRequestFromRemoteBridge<T extends RpcMethod>(
        request: AppRequest<T>,
        clientSessionId: string,
        callback: (response: WalletResponse<T>) => void,
        from: string
    ) {
        const { connectedApp } = this.findConnectedAppByClientSessionId(clientSessionId);
        console.log('handleRequestFromRemoteBridge', { connectedApp });
        this.handleRequest(request, connectedApp, callback, from);
    }

    sendDisconnectEvent(connection: ConnectedAppConnectionRemote) {
        const sessionCrypto = new SessionCrypto(connection.sessionKeyPair);
        const event: DisconnectEvent = { event: 'disconnect', payload: {} };
        this.send({ response: event, sessionCrypto, clientSessionId: connection.clientSessionId });
    }

    async disconnect(url: string) {
        const connectedApp = this.getConnectedAppByUrl(url);

        if (!connectedApp) {
            return;
        }

        const remoteConnections = connectedApp.connections.filter(
            (connection) => connection.type === TonConnectBridgeType.Remote,
        ) as ConnectedAppConnectionRemote[];

        remoteConnections.forEach((connection) => this.sendDisconnectEvent(connection));

        this.removeConnectedApp(url);
    }

    getConnectionByClientSessionId(clientSessionId: string): ConnectedAppConnectionRemote | undefined {
        console.log({ connections: this.connections });
        const connection = this.connections.find((item) => {
            console.log({ item, finding: clientSessionId });
            return item.clientSessionId === clientSessionId
        });

        if (!!connection) {
            return connection;
        }

        logger.warn(`connection with clientId "${clientSessionId}" not found!`);
        return;
    }

    private async handleMessage(event: MessageEvent) {
        try {
            if (event.lastEventId) {
                this.setLastEventId(event.lastEventId);
            }

            console.log('handleMessage', { data: event.data });

            const { from, message } = JSON.parse(event.data!);
            console.log('Parsed', { from, message });

            console.log('handleMessage', from);

            const connection = this.connections.find((item) => item.clientSessionId === from);

            if (!connection) {
                console.log(`connection with clientId "${from}" not found!`);
                return;
            }

            const sessionCrypto = new SessionCrypto(connection.sessionKeyPair);

            const request: AppRequest<RpcMethod> = JSON.parse(
                sessionCrypto.decrypt(
                    Base64.decode(message).toUint8Array(),
                    hexToByteArray(from),
                ),
            );

            if (this.activeRequests[from]) {
                await this.send({
                    response: {
                        error: {
                            code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                            message: 'User has already opened the previous request',
                        },
                        id: request.id.toString(),
                    },
                    sessionCrypto,
                    clientSessionId: from,
                });

                return;
            }

            this.activeRequests[from] = request;

            console.log('handleMessage request', request);

            const callback = (response: WalletResponse<RpcMethod>) => {
                delete this.activeRequests[from];
                console.log('handleMessage response', response);
                this.send({ response, sessionCrypto, clientSessionId: from });
            }

            this.handleRequestFromRemoteBridge(request, from, callback, from);
        } catch (e) {
            console.log('handleMessage error');
            console.error(e);
        }
    }

    deleteActiveRequest(clientSessionId: string) {
        delete this.activeRequests[clientSessionId];

        this.pendingItem.update((doc) => {
            const temp = doc ?? [];
            const index = temp.findIndex((item) => item.from === clientSessionId);
            if (index !== -1) {
                temp.splice(index, 1);
            }
            return temp;
        });
    }
}