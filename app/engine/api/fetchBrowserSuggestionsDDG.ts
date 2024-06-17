import axios from "axios";
import { z } from "zod";

export type SearchSuggestion = {
    source: 'web-search';
    url: string;
    title: string;
}

const searchResultsCodec = z.array(z.object({ phrase: z.string() }));

export async function fetchBrowserSuggestionsDDG(query: string, abortController: AbortController) {
    const url = `https://duckduckgo.com/ac/?kl=wt-wt&q=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { signal: abortController.signal });

    const parsedRes = searchResultsCodec.safeParse(res.data);

    if (!parsedRes.success) {
        return [];
    }

    const items = parsedRes.data.map((item) => item.phrase);

    if (items.length === 0) {
        return [];
    }

    // Remove duplicates and add the query itself
    const itemsWithQuery = Array.from(new Set([query, ...items]));

    // First 4 items are the most relevant including the query itself
    return itemsWithQuery.slice(0, 4).map((phrase): SearchSuggestion => {
        return {
            // ddg search url
            url: `https://duckduckgo.com/?q=${encodeURIComponent(phrase)}`,
            title: phrase,
            source: 'web-search'
        };
    });
}