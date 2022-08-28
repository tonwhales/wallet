import * as React from 'react';
import { View } from 'react-native';
import { AppConfig } from '../../AppConfig';
import { RoundButton } from '../../components/RoundButton';
import { fetchCardToken } from '../../engine/api/fetchCardToken';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { useEngine } from '../../engine/Engine';
import { fragment } from '../../fragment';
import { getCurrentAddress } from '../../storage/appState';

export const CardFragment = fragment(() => {

    const engine = useEngine();
    const enroll = React.useCallback(async () => {

        //
        // Create domain key if needed
        //

        let created = await engine.products.keys.createDomainKeyIfNeeded('corp.whalescorp.com');
        if (!created) {
            return;
        }

        //
        // Create sign
        //

        let account = getCurrentAddress();
        let contract = contractFromPublicKey(account.publicKey);
        let signed = engine.products.keys.createDomainSignature('corp.whalescorp.com');
        let token = await fetchCardToken({
            address: contract.address.toFriendly({ testOnly: AppConfig.isTestnet }),
            walletConfig: contract.source.backup(),
            walletType: contract.source.type,
            time: signed.time,
            signature: signed.signature,
            subkey: signed.subkey
        });
        console.warn(token);
    }, []);

    return (
        <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ flexGrow: 1 }} />
            <View style={{ flexDirection: 'row' }}>
                <RoundButton
                    title={'Enroll'}
                    action={enroll}
                    style={{
                        marginLeft: 7,
                        height: 56,
                        flexGrow: 1,
                    }}
                />
            </View>
            <View style={{ flexGrow: 1 }} />
        </View>
    );
});