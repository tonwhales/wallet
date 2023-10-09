import { useEffect } from 'react';
import { storage } from '../storage/storage';
import EventSource, { MessageEvent } from 'react-native-sse';
import { createLogger, warn } from '../utils/log';
import { ConnectedAppConnection, ConnectedAppConnectionRemote, TonConnectBridgeType } from './legacy/tonconnect/types';
import { useTonConnectExtensions } from './hooks/dapps/useTonConnectExtenstions';
import { useAppConnections } from './hooks/dapps/useAppConnections';
import { SessionCrypto } from '@tonconnect/protocol';
import { useHandleMessage } from './effects/dapps/useHandleMessage';

const logger = createLogger('tonconnect');
export const bridgeUrl = 'https://connect.tonhubapi.com/tonconnect';

export function setLastEventId(lastEventId: string) {
    storage.set('connect_last_event_id', lastEventId);
}

export function getLastEventId() {
    return storage.getString('connect_last_event_id');
}

export function useTonconnectWatcher() {
    const [extensions,] = useTonConnectExtensions();
    const getConnections = useAppConnections();
    const apps = Object.keys(extensions.installed);
    const connections: ConnectedAppConnection[] = []

    for (let appKey of apps) {
        const appConnections = getConnections(appKey);
        connections.push(...(appConnections ?? []));
    }

    const handleMessage = useHandleMessage(
        connections.filter((item) => item.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[],
        logger
    );

    useEffect(() => {
        const apps = Object.keys(extensions.installed);
        const connections: ConnectedAppConnectionRemote[] = [];
        for (let appKey of apps) {
            const appConnections = getConnections(appKey);
            connections.push(
                ...(
                    appConnections.filter((item) => item.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[]
                    ?? []
                ));
        }

        if (connections.length === 0) {
            return;
        }

        const walletSessionIds = connections.map((item) => new SessionCrypto(item.sessionKeyPair).sessionId).join(',');
        let url = `${bridgeUrl}/events?client_id=${walletSessionIds}`;
        const lastEventId = getLastEventId();

        if (lastEventId) {
            url += `&last_event_id=${lastEventId}`;
        }

        let watcher: EventSource | null = new EventSource(url);
        watcher.addEventListener(
            'message',
            (event) => {
                handleMessage(event as MessageEvent);
            }
        );

        watcher.addEventListener('open', () => {
            logger.log('sse connect: opened');
        });

        watcher.addEventListener('close', () => {
            logger.log('sse connect: closed');
        });

        watcher.addEventListener('error', (event) => {
            warn('sse connect: error' + JSON.stringify(event));
        });

        return () => {
            if (watcher) {
                watcher.removeAllEventListeners();
                watcher.close();
                watcher = null;

                logger.log('sse close');
            }
        };
    }, [handleMessage]);
}