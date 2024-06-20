import { useEffect, useMemo, useState } from 'react';
import EventSource, { MessageEvent } from 'react-native-sse';
import { createLogger, warn } from '../utils/log';
import { SessionCrypto } from '@tonconnect/protocol';
import { useHandleMessage } from './hooks';
import { ConnectedAppConnection, ConnectedAppConnectionRemote, TonConnectBridgeType } from './tonconnect/types';
import { getLastEventId } from './tonconnect/utils';
import { bridgeUrl } from './tonconnect/config';
import { useAppsConnections } from './hooks/dapps/useAppConnections';

const logger = createLogger('tonconnect');

export function useTonconnectWatcher() {
    const [session, setSession] = useState(0);
    const connectionsMap = useAppsConnections();
    const connections = useMemo(() => {
        return Object.values(connectionsMap).reduce((acc, item) => {
            acc.push(...item);
            return acc;
        }, [] as ConnectedAppConnection[]).filter((item) => item.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[];
    }, [connectionsMap]);

    const handleMessage = useHandleMessage(
        connections.filter((item) => item.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[],
        logger
    );

    useEffect(() => {
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
            // set new session to force close connection & reconnect on error
            setSession(session + 1);
        });

        return () => {
            if (watcher) {
                watcher.removeAllEventListeners();
                watcher.close();
                watcher = null;

                logger.log('sse close');
            }
        };
    }, [handleMessage, connections, session]);
}