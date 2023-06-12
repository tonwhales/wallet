import { extractDomain } from "../../../../engine/utils/extractDomain";

export function protectNavigation(url: string, app: string) {
    let appDomain = extractDomain(app);
    let pageDomain = extractDomain(url);
    return true;
    if (!appDomain || !pageDomain) {
        return false;
    }
    if (pageDomain.endsWith('.sumsub.com')) {
        return true
    }
    if (pageDomain.endsWith('.' + appDomain)) {
        return true;
    }
    // To account for metrics redirects
    if (pageDomain.endsWith('mc.yandex.ru')) {
        return true;
    }
    return false;
}