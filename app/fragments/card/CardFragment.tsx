import * as React from 'react';
import { View } from 'react-native';
import { AppConfig } from '../../AppConfig';
import { RoundButton } from '../../components/RoundButton';
import { fetchCardPhoneTicket } from '../../engine/api/fetchCardPhoneTicket';
import { fetchCardState } from '../../engine/api/fetchCardState';
import { fetchCardToken } from '../../engine/api/fetchCardToken';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { useEngine } from '../../engine/Engine';
import { fragment } from '../../fragment';
import { getCurrentAddress } from '../../storage/appState';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

export const CardFragment = fragment(() => {

    const engine = useEngine();
    const navigation = useTypedNavigation();
    const enroll = React.useCallback(async () => {

        //
        // Get Or Create Card Token
        //

        let walletToken: string;
        let existing = await engine.cloud.readKey('card-key');
        if (existing) {
            walletToken = existing.toString();
        } else {

            //
            // Create domain key if needed
            //

            let created = await engine.products.keys.createDomainKeyIfNeeded('card.whales-api.com');
            if (!created) {
                return;
            }

            //
            // Create sign
            //

            let account = getCurrentAddress();
            let contract = contractFromPublicKey(account.publicKey);
            let signed = engine.products.keys.createDomainSignature('card.whales-api.com');
            let token = await fetchCardToken({
                address: contract.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                walletConfig: contract.source.backup(),
                walletType: contract.source.type,
                time: signed.time,
                signature: signed.signature,
                subkey: signed.subkey
            });
            await engine.cloud.update('card-key', () => Buffer.from(token));
            walletToken = token;
        }

        //
        // Fetch card state
        //

        let currentState = await fetchCardState(walletToken);
        if (currentState.state === 'need-phone') {
            navigation.replace('Phone');
        }

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