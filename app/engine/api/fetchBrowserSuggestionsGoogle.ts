import axios from "axios";
import { z } from "zod";
import { SearchSuggestion } from "./fetchBrowserSuggestionsDDG";

const searchItemsCodec = z.array(z.string());

export async function fetchBrowserSuggestionsGoogle(query: string, abortController: AbortController) {
    const url = `https://suggestqueries.google.com/complete/search?q=$${encodeURIComponent(query)}&client=firefox`;
    const res = await axios.get(url, { signal: abortController.signal });

    if (res.data && Array.isArray(res.data) && res.data.length > 1) {
        const items = res.data[1];
        const parsed = searchItemsCodec.safeParse(items);

        if (!parsed.success) {
            return [];
        }

        // Remove duplicates and add the query itself
        const itemsWithQuery = Array.from(new Set([query, ...parsed.data]));

        // First 4 items are the most relevant including the query itself
        return itemsWithQuery.slice(0, 4).map((title): SearchSuggestion => {
            const q = !query.startsWith('=') && title.startsWith('= ') ? query : title;

            return {
                // Google search url
                url: `https://www.google.com/search?q=${q}`,
                title,
                source: 'web-search'
            };
        });
    }

    return [];
}