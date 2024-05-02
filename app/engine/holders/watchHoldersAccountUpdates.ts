import { createLogger } from '../../utils/log';
import { holdersEndpoint } from '../api/holders/fetchAccountState';

let index = 0;

const logger = createLogger('hold-watcher');

export function watchHoldersAccountUpdates(token: string, handler: (event: any) => void, isTestnet: boolean) {
    let closed = false;
    let socket: WebSocket | null = null;
    let i = index++;
    function doOpen() {
        const endpoint = holdersEndpoint(isTestnet);
        let s = new WebSocket(`wss://${endpoint}/v2/updates`);
        socket = s;
        socket.onopen = () => {
            socket!.send(JSON.stringify({ type: 'connect', token: token }));
            logger.log(`[${i}] Connected`);
        };
        socket.onclose = () => {
            if (socket === s) {
                if (!closed) {
                    socket = null;
                    setTimeout(() => {
                        if (!closed) {
                            doOpen();
                        }
                    }, 5000);
                    logger.log(`[${i}] Disconnected`);
                }
            }
        };
        socket.onmessage = (msg) => {
            let d = JSON.parse(msg.data as string);
            handler(d);
            logger.log(`[${i}] Message: ${msg.data}`);
        };
    }
    doOpen();

    return () => {
        closed = true;
        if (socket) {
            let s = socket;
            socket = null;
            s.close();
        }
    };
}