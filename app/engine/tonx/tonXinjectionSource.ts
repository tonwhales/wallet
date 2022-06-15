export const tonXinjectionSource = `
if (window.tonXCallbacks == undefined) window.tonXCallbacks = {};
if (window.tonXData == undefined) window.tonXData = {};

window.addEventListener('ton-x-message', (ev) => {
    let payload = ev.detail;
    if (payload.id) {
        if (window.tonXCallbacks[payload.id]) {
            window.tonXCallbacks[payload.id](payload.data || {});
        }
    }
});

window.tonX = {
    tonXRequestId: 0,
    call: function (type, data, callback) {
        window.ReactNativeWebView.postMessage(JSON.stringify(
            {
                id: ++this.tonXRequestId,
                type,
                data
            }
        ));
        window.tonXCallbacks[this.tonXRequestId] = callback;
        return this.tonXRequestId;
    }
};
true;
`;