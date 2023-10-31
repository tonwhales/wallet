import { holdersEndpoint } from "../../api/holders/fetchAccountState";

let index = 0;

export function watchHoldersAccountUpdates(token: string, handler: (event: any) => void) {
    let closed = false;
    let socket: WebSocket | null = null;
    let i = index++;
    function doOpen() {
        let s = new WebSocket(`wss://${holdersEndpoint}/account/updates`);
        socket = s;
        socket.onopen = () => {
            socket!.send(JSON.stringify({ type: 'connect', token: token }));
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
                }
            }
        };
        socket.onmessage = (msg) => {
            let d = JSON.parse(msg.data as string);
            handler(d);
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