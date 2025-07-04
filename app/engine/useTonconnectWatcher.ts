import { useEffect, useMemo, useRef, useState } from 'react';
import EventSource, { MessageEvent } from 'react-native-sse';
import { createLogger, warn } from '../utils/log';
import { SessionCrypto } from '@tonconnect/protocol';
import { useHandleMessage } from './hooks';
import { useAppsConnections } from './hooks/dapps/useAppConnections';
import { bridgeUrl, ConnectedAppConnection, ConnectedAppConnectionRemote, getLastEventId, TonConnectBridgeType } from './tonconnect';

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

    const handleMessage = useHandleMessage(connections, logger);

    const handleMessageRef = useRef(handleMessage);

    useEffect(() => {
        handleMessageRef.current = handleMessage;
    }, [handleMessage]);

    const sessionTimeout = useRef<NodeJS.Timeout | null>(null);

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
        watcher.addEventListener('message', (event) => {
            logger.log('new event: ' + event.type);
            handleMessageRef.current(event as MessageEvent);
        });

        watcher.addEventListener('open', () => {
            logger.log('sse connect: opened');
        });

        watcher.addEventListener('close', () => {
            logger.log('sse connect: closed');
        });

        watcher.addEventListener('error', (event) => {
            warn('sse connect: error' + JSON.stringify(event));
            // set new session to force close connection & reconnect on error
            if (session < 1000) { // limit to 1000 reconnects (to avoid infinite loop)
                if (sessionTimeout.current) {
                    return;
                }
                sessionTimeout.current = setTimeout(() => {
                    setSession(session + 1);
                }, 5000);
            }
        });

        return () => {
            if (sessionTimeout.current) {
                clearTimeout(sessionTimeout.current);
                sessionTimeout.current = null;
            }

            if (watcher) {
                watcher.removeAllEventListeners();
                watcher.close();
                watcher = null;

                logger.log('sse close');
            }
        };
    }, [connections, session]);
}