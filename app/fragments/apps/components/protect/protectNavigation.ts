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
    if (pageDomain.endsWith('.kauri.finance')) {
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
        pageDomain === 'verify.walletconnect.com'
        || pageDomain === 'verify.walletconnect.org'
        || pageDomain.endsWith('.verify.walletconnect.com')
        || pageDomain.endsWith('.verify.walletconnect.org')
    ) {
        return true;
    }
    // To account for verygoodvault redirects
    if (
        pageDomain === 'js.verygoodvault.com'
        || pageDomain.endsWith('.js.verygoodvault.com')
    ) {
        return true;
    }

    if (
        pageDomain === 'holders.io'
        || pageDomain.endsWith('.holders.io')
    ) {
        return true;
    }

    // To account for intercom articles redirects
    if (
        pageDomain === 'intercom-sheets.com'
        || pageDomain.endsWith('.intercom-sheets.com')
    ) {
        return true;
    }

    return false;
}