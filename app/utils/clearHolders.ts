import { Engine } from "../engine/Engine";
import { holdersUrl } from "../engine/corp/ZenPayProduct";
import { extractDomain } from "../engine/utils/extractDomain";
import { getCurrentAddress } from "../storage/appState";

export function clearHolders(engine: Engine) {
    const acc = getCurrentAddress();
    const holdersDomain = extractDomain(holdersUrl);
    engine.products.zenPay.stopWatching();
    engine.persistence.domainKeys.setValue(
        `${(acc.address).toFriendly({ testOnly: engine.isTestnet })}/${holdersDomain}`,
        null
    );
    engine.persistence.zenPayState.setValue(acc.address, null);
    engine.cloud.update('zenpay-jwt', () => Buffer.from(''));
}