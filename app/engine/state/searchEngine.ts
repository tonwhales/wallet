import { atom } from "recoil";
import { sharedStoragePersistence } from "../../storage/storage";

export type SearchEngine = 'google' | 'ddg';

const searchEngineKey = 'searchEngine';

function getSearchEngineState(): SearchEngine {
    const stored = sharedStoragePersistence.getString(searchEngineKey);

    // default search engine is DuckDuckGo
    if (!stored) {
        return 'ddg';
    }

    return stored as SearchEngine;
}

function storeSearchEngineState(state: SearchEngine) {
    sharedStoragePersistence.set(searchEngineKey, state);
}

export const searchEngineAtom = atom<SearchEngine>({
    key: 'searchEngine',
    default: getSearchEngineState(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeSearchEngineState(newValue);
        })
    }]
});