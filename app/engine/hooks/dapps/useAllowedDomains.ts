import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { AllowedDomains, fetchAllowedDomains } from "../../api/fetchAllowedDomains";
import { queryClient } from "../../clients";
import { getQueryData } from "../../utils/getQueryData";

// Built-in allowed domains (fallback)
const builtInAllowedDomains: string[] = [
    'challenges.cloudflare.com',
    '.challenges.cloudflare.com',
    '.sumsub.com',
    '.kauri.finance',
    'mc.yandex.ru',
    '.mc.yandex.ru',
    'verify.walletconnect.com',
    'verify.walletconnect.org',
    '.verify.walletconnect.com',
    '.verify.walletconnect.org',
    'js.verygoodvault.com',
    '.js.verygoodvault.com',
    'help.holders.io',
    '.help.holders.io',
    'intercom-sheets.com',
    '.intercom-sheets.com',
    'intercom.help',
    '.intercom.help',
    'app.checkbook.io',
    '.app.checkbook.io',
    'sandbox.checkbook.io',
    '.sandbox.checkbook.io',
];

export function useAllowedDomains(): AllowedDomains {
    const fetched = useQuery({
        queryKey: Queries.AllowedDomains(),
        queryFn: fetchAllowedDomains,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    }).data ?? null;

    // Merge built-in data with fetched
    const domains = [...new Set([...builtInAllowedDomains, ...(fetched?.domains ?? [])])];

    return { domains };
}

export function getAllowedDomains(): AllowedDomains {
    const cache = queryClient.getQueryCache();
    const fetched = getQueryData<{ domains: string[] } | null>(cache, Queries.AllowedDomains());

    // Merge built-in data with fetched
    const domains = [...new Set([...builtInAllowedDomains, ...(fetched?.domains ?? [])])];

    return { domains };
}

export function isDomainAllowed(pageDomain: string, allowedDomains: string[]): boolean {
    for (const pattern of allowedDomains) {
        // Pattern starts with '.' - it's a suffix match
        if (pattern.startsWith('.')) {
            if (pageDomain.endsWith(pattern) || pageDomain === pattern.slice(1)) {
                return true;
            }
        } else {
            // Exact match
            if (pageDomain === pattern) {
                return true;
            }
        }
    }
    return false;
}

