import { useEffect, useRef, useState } from "react";
import { SearchSuggestion, fetchBrowserSuggestionsDDG } from "../../api/fetchBrowserSuggestionsDDG";
import { fetchBrowserSuggestionsGoogle } from "../../api/fetchBrowserSuggestionsGoogle";
import axios from "axios";
import { BrowserSearchSuggestion } from "./useDAppsSuggestions";
import { SearchEngine } from "../../state/searchEngine";

function fetchSuggestions(query: string, searchEngine: SearchEngine, abortController: AbortController) {
    if (searchEngine === 'google') {
        return fetchBrowserSuggestionsGoogle(query, abortController);
    }

    return fetchBrowserSuggestionsDDG(query, abortController);
}

export function useBrowserWebSearchSuggestions(query: string, searchEngine: SearchEngine) {
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

    useEffect(() => {
        const abortController = new AbortController();

        if (query.length === 0) {
            setSuggestions([]);
            return;
        }

        (async () => {
            try {
                const res = await fetchSuggestions(query.trim(), searchEngine, abortController);
                setSuggestions(res);
            } catch (e) {
                const isCanceled = axios.isCancel(e);

                if (!isCanceled) {
                    setSuggestions([]);
                    console.warn(e);
                }
            }
        })();

        return () => {
            abortController.abort();
        };

    }, [searchEngine, query]);

    return suggestions as BrowserSearchSuggestion[];
}