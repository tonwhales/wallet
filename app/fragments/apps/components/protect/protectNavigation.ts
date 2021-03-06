import { extractDomain } from "../../../../engine/utils/extractDomain";

export function protectNavigation(url: string, app: string) {
    let appDomain = extractDomain(app);
    let pageDomain = extractDomain(url);
    if (!appDomain || !pageDomain) {
        return false;
    }
    if (pageDomain.endsWith('.' + appDomain)) {
        return true;
    }
    return false;
}