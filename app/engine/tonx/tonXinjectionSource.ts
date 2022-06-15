export const tonXinjectionSource = `
if (window.tonXMessages == undefined) window.tonXMessages = {};

window.addEventListener('ton-x-message', (ev) => {
    let payload = ev.detail;
    if (payload.id) {
        window.tonXMessages[payload.id] = payload.data || {};
    }
});

window.tonX = {
    tonXRequestId: 0,
    dispatchMessage: function (type, data) {
        window.ReactNativeWebView.postMessage(JSON.stringify(
            {
                id: ++this.tonXRequestId,
                type,
                data
            }
        ));
        return this.tonXRequestId;
    },
    watchMessage: async function (id) {
        let timeouted = false;
        setTimeout(() => {
            timeouted = true;
        }, 30000);
        while (!timeouted) {
            if (window.tonXMessages[id]) {
                let result = window.tonXMessages[id];
                delete window.tonXMessages[id];
                return result;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error('Tonhub watch message failed for id: ' + id);
    },
    call: async function (type, data) {
        let id = this.dispatchMessage(type, data);
        return this.watchMessage(id);
    }
};
true;
 `;