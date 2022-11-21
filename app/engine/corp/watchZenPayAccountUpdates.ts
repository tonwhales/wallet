import { zenPayEndpoint } from "./ZenPayProduct";

let index = 0;

export function watchZenPayAccountUpdates(token: string, handler: (event: any) => void) {
    let closed = false;
    let socket: WebSocket | null = null;
    let i = index++;
    function doOpen() {
        console.log(`socket #${i} starting`);
        let s = new WebSocket(`wss://${zenPayEndpoint}/account/updates`);
        socket = s;
        socket.onopen = () => {
            console.log(`socket #${i} opened`);
            socket!.send(JSON.stringify({ type: 'connect', token: token }));
        };
        socket.onclose = () => {
            if (socket === s) {
                console.log(`socket #${i} closed`);
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
            console.log(`socket #${i} update`, d);
        };
    }
    doOpen();

    return () => {
        console.log(`socket #${i} stopped`);
        closed = true;
        if (socket) {
            let s = socket;
            socket = null;
            s.close();
        }
    };
}