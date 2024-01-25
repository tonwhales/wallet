export function isSafeDomain(domain: string) {
    return (
        domain === 'tonsandbox.com' || domain.endsWith('.tonsandbox.com')
        || domain === 'tonwhales.com' || domain.endsWith('.tonwhales.com')
        || domain === 'tontestnet.com' || domain.endsWith('.tontestnet.com')
        || domain === 'tonhub.com' || domain.endsWith('.tonhub.com')
        || domain === 't.me' || domain.endsWith('.t.me')
    );
}