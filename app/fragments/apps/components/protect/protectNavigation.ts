import { extractDomain } from "../../../../engine/utils/extractDomain";

// domains that are not app/page but should be protected
export function isAllowedDomain(pageDomain: string) {
    if (pageDomain.endsWith('.sumsub.com')) {
        return true
    }
    if (pageDomain.endsWith('.kauri.finance')) {
        return true
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
        pageDomain === 'help.holders.io'
        || pageDomain.endsWith('help.holders.io')
    ) {
        return true;
    }

    // To account for intercom articles redirects
    if (
        pageDomain === 'intercom-sheets.com'
        || pageDomain.endsWith('.intercom-sheets.com')
        || pageDomain === 'intercom.help'
        || pageDomain.endsWith('.intercom.help')
    ) {
        return true;
    }

    if (
        pageDomain === 'app.checkbook.io'
        || pageDomain.endsWith('.app.checkbook.io')
        || pageDomain === 'sandbox.checkbook.io'
        || pageDomain.endsWith('.sandbox.checkbook.io')
    ) {
        return true;
    }

    return false;
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