import { Address } from "ton";
import { Engine } from "../engine/Engine";
import { holdersUrl } from "../engine/corp/ZenPayProduct";
import { extractDomain } from "../engine/utils/extractDomain";

export function clearHolders(engine: Engine, address: Address) {
    const holdersDomain = extractDomain(holdersUrl);
    engine.products.zenPay.stopWatching();
    engine.persistence.domainKeys.setValue(
        `${(address).toFriendly({ testOnly: engine.isTestnet })}/${holdersDomain}`,
        null
    );
    engine.persistence.zenPayState.setValue(address, null);
    engine.cloud.update('zenpay-jwt', () => Buffer.from(''));
}