import { useRecoilState } from "recoil";
import { connectExtensionsMapAtom } from "../../state/tonconnect";
import { useMemo } from "react";
import { Trie } from "../../../utils/wordsListTrie";
import { extractDomain } from "../../utils/extractDomain";
import { normalizeUrl } from "../../../utils/resolveUrl";

export type BrowserSearchSuggestion = {
    source: 'dapp' | 'web-search';
    url: string;
    title?: string;
    icon?: string;
}

const knownDApps = {
    'https://t.me/tonhub': {
        title: 'Tonhub',
        icon: 'https://ucarecdn.com/7d75de5c-da0c-43cf-8f34-3cb7533dd481/'
    },
    'https://dedust.io': {
        title: 'DeDust.io',
        icon: 'https://dedust.io/apple-touch-icon.png'
    },
    'https://tonwhales.com': {
        title: 'Ton Whales',
        icon: 'https://ucarecdn.com/b934939e-31a1-43da-b996-c3f3e041d8d6/'
    },
    'https://tonviewer.com': {
        title: 'TON Explorer by Tonviewer: Blockchain Analysis',
        icon: 'https://ucarecdn.com/2204e9b4-f577-47d6-9581-5882c140b2bc/'
    },
    'https://getgems.io': {
        title: 'Getgems — TON NFT Marketplace',
        icon: 'https://ucarecdn.com/39b288eb-9f38-439e-8b00-89b816a5387b/'
    },
    'https://gmt.io/ton': {
        title: 'GoMining Whales NFT',
        icon: 'https://ucarecdn.com/0a977ee2-8143-48b5-90e3-8d7925970e15/'
    },
    'https://ston.fi': {
        title: 'STON.fi — AMM DEX for the TON blockchain',
        icon: 'https://ucarecdn.com/4ab891ea-5728-4612-9fc0-42bcb8d19ca6/'
    },
    'https://holders.io': {
        title: 'Holders',
        icon: 'https://ucarecdn.com/490986ac-c285-4932-a67f-c75c38f34283/'
    },
    'https://fragment.com': {
        title: 'Fragment',
        icon: 'https://ucarecdn.com/b6b4100e-3194-4f9b-9210-c924a9f92988/'
    },
    'https://dns.ton.org': {
        title: 'Buy .ton domains',
        icon: 'https://ucarecdn.com/7a3bdafd-13d1-484a-89c0-87de5836c9a2/'
    },
    'https://t.me/tonwhalesnews': {
        title: 'Whales',
        icon: 'https://ucarecdn.com/5b70f741-28bf-4025-9f96-2298b04c23a4/'
    },
    'https://t.me/tonsociety': {
        title: 'TON Society',
        icon: 'https://ucarecdn.com/02029c69-2ebb-404f-94f8-d634d7dd1d06/'
    },
    'https://t.me/cryptopenetration': {
        title: 'Crypto Penetration blog 🔩',
        icon: 'https://ucarecdn.com/be23ce08-e70f-4cec-910e-ec889b23e142/'
    },
    'https://t.me/toncoin': {
        title: 'TON Community',
        icon: 'https://ucarecdn.com/1c2c714c-9285-4f00-840b-ecca8cae4aa4/'
    }
};

export function useDAppsSuggestions(query: string) {
    const [fullMap,] = useRecoilState(connectExtensionsMapAtom);



    const [apps, trie] = useMemo(() => {
        const byAllAccs = Object.values(fullMap);
        const appsMap = new Map<string, BrowserSearchSuggestion>();
        const trie = new Trie();

        byAllAccs.forEach(acc => {
            Object.values(acc).forEach(app => {
                const nameItems = app.name.split(' ');
                const appKeys = [app.url];
                const normalizedUrl = normalizeUrl(app.url) ?? app.url;
                const domain = extractDomain(normalizedUrl);

                // add full name to appKeys
                appKeys.push(`${app.name}_${app.url}`);

                // add name items to appKeys without first item (it's already in full name)
                nameItems.slice(1).forEach(item => {
                    appKeys.push(`${item}_${app.url}`);
                });

                // add domain to appKeys
                appKeys.push(`${domain}_${app.url}`);


                if (appsMap.has(app.url)) {
                    return
                }

                appsMap.set(app.url, {
                    title: app.name,
                    url: app.url,
                    icon: app.iconUrl,
                    source: 'dapp'
                });

                // add all appKeys to trie
                appKeys.forEach(key => trie.insert(key.toLocaleLowerCase()));
            });
        });

        Object.entries(knownDApps).forEach(([url, { title, icon }]) => {
            if (appsMap.has(url)) {
                return
            }

            appsMap.set(url, {
                title,
                url,
                icon,
                source: 'dapp'
            });

            const nameItems = title.split(' ');
            const appKeys = [url];
            const domain = extractDomain(url);

            // add full name to appKeys
            appKeys.push(`${title}_${url}`);

            // add name items to appKeys without first item (it's already in full name)
            nameItems.slice(1).forEach(item => {
                appKeys.push(`${item}_${url}`);
            });

            // add domain to appKeys
            appKeys.push(`${domain}_${url}`);

            // add all appKeys to trie
            appKeys.forEach(key => trie.insert(key.toLocaleLowerCase()));
        });

        return [appsMap, trie];
    }, [fullMap]);

    return useMemo(() => {
        const filteredQuery = query.trim().toLocaleLowerCase();

        if (filteredQuery.length === 0) {
            return [];
        }

        const suggestionKeys = trie.find(filteredQuery);

        const keys = new Set<string>(
            suggestionKeys
                .map(s => s.split('_').pop())
                .filter((item) => !!item) as string[]
        );

        return [...keys]
            .map(k => apps.get(k))
            .filter((item) => !!item) as BrowserSearchSuggestion[];
    }, [query, apps, trie]);
}