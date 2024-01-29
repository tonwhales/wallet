import { extractDomain } from "../../../../engine/utils/extractDomain";

export function protectNavigation(url: string, app: string) {
    let appDomain = extractDomain(app);
    let pageDomain = extractDomain(url);
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
    if (pageDomain === 'mc.yandex.ru' || pageDomain.endsWith('.mc.yandex.ru')) {
        return true;
    }
    // To account for walletconnect redirects
    if (
        pageDomain === '.walletconnect.com'
        || pageDomain.endsWith('.walletconnect.com')
        || pageDomain === 'walletconnect.org'
        || pageDomain.endsWith('.walletconnect.org')
    ) {
        return true;
    }
    return false;
}