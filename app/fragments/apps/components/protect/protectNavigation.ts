import { extractDomain } from "../../../../engine/utils/extractDomain";
import { getAllowedDomains, isDomainAllowed } from "../../../../engine/hooks/dapps/useAllowedDomains";

export function isAllowedDomain(pageDomain: string) {
    const { domains } = getAllowedDomains();
    return isDomainAllowed(pageDomain, domains);
}

export function protectNavigation(url: string, app: string) {
    const appDomain = extractDomain(app);
    const pageDomain = extractDomain(url);

    if (!appDomain || !pageDomain) {
        return false;
    }

    if (pageDomain.endsWith('.' + appDomain)) {
        return true;
    }

    if (isAllowedDomain(pageDomain)) {
        return true;
    }

    return false;
}