import { Linking } from "react-native";

let lastLink: string | null = null;
let listener: (((link: string) => void) | null) = null;

function handleLinkReceived(link: string) {
    if (listener) {
        listener(link);
    } else {
        lastLink = link;
    }
}

// Fetch initial
(async () => {
    let url = await Linking.getInitialURL();
    if (url) {
        handleLinkReceived(url);
    }
})();

// Subscribe for links
Linking.addEventListener('url', (e) => {
    handleLinkReceived(e.url);
});

export const CachedLinking = {
    setListener: (handler: (link: string) => void) => {
        if (listener) {
            throw Error('Listener already set');
        }
        listener = handler;
        if (lastLink) {
            let l = lastLink;
            lastLink = null;
            handler(l);
        }
        return () => {
            if (listener !== handler) {
                throw Error('Internal error');
            }
            listener = null;
        };
    }
};