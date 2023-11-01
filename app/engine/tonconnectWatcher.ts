import { useEffect, useMemo } from 'react';
import { storage } from '../storage/storage';
import EventSource, { MessageEvent } from 'react-native-sse';
import { createLogger, warn } from '../utils/log';
import { useTonConnectExtensions } from './hooks/dapps/useTonConnectExtenstions';
import { useAppConnections } from './hooks/dapps/useAppConnections';
import { SessionCrypto } from '@tonconnect/protocol';
import { useHandleMessage } from './effects/dapps/useHandleMessage';
import { ConnectedAppConnection, ConnectedAppConnectionRemote, TonConnectBridgeType } from './tonconnect/types';
import { getLastEventId } from './tonconnect/utils';
import { bridgeUrl } from './tonconnect/config';

const logger = createLogger('tonconnect');

export function useTonconnectWatcher() {
    const [extensions,] = useTonConnectExtensions();
    const getConnections = useAppConnections();
    const appKeys = Object.keys(extensions);

    const connections = useMemo(() => {
        const temp: ConnectedAppConnection[] = [];
        for (let appKey of appKeys) {
            const appConnections = getConnections(appKey);
            temp.push(...(appConnections ?? []));
        }
        return temp
    }, [appKeys, getConnections]);

    const handleMessage = useHandleMessage(
        connections.filter((item) => item.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[],
        logger
    );

    useEffect(() => {
        const apps = Object.keys(extensions);
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