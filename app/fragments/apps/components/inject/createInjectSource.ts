export function createInjectSource(config: any) {
    return `
    window['ton-x'] = (() => {
        let requestId = 0;
        let callbacks = {};
        let config = ${JSON.stringify(config)};
    
        window.addEventListener('ton-x-message', (ev) => {
            let payload = ev.detail;
            if (payload.id) {
                if (callbacks[payload.id]) {
                    callbacks[payload.id](payload.data || {});
                }
            }
        });
    
        const call = (name, args, callback) => {
            let id = requestId++;
            window.ReactNativeWebView.postMessage(JSON.stringify({ id, data: { name, args } }));
            callbacks[id] = callback;
        };
        
        return { call, config };
    })();
    
    true;
    `;
};