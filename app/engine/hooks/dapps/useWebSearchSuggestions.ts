import { useMemo, useRef } from "react";
import { useBrowserWebSearchSuggestions, useDAppsSuggestions, useSearchEngine } from "..";
import { BrowserSearchSuggestion } from "./useDAppsSuggestions";

export function useWebSearchSuggestions(query: string) {
    const dappsSuggestions = useDAppsSuggestions(query);
    const [searchEngine,] = useSearchEngine();
    const webSuggestions = useBrowserWebSearchSuggestions(query, searchEngine);

    const resRef = useRef<BrowserSearchSuggestion[]>([]);

    const getSuggestions = () => {
        return resRef.current;
    }

    const suggestions = useMemo(() => {
        const res = [...dappsSuggestions, ...webSuggestions];
        resRef.current = res;
        return {
            dapps: dappsSuggestions,
            web: webSuggestions,
        };
    }, [dappsSuggestions, webSuggestions]);

    return { suggestions, getSuggestions, searchEngine };
}