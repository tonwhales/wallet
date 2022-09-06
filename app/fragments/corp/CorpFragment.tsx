import * as React from 'react';
import { Text, View } from 'react-native';
import { FragmentMediaContent } from '../../components/FragmentMediaContent';
import { RoundButton } from '../../components/RoundButton';
import { useEngine } from '../../engine/Engine';
import { fragment } from '../../fragment';
import { Theme } from '../../Theme';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { startIDVerification } from './id/startIDVerification';

export const CorpFragment = fragment(() => {

    const engine = useEngine();
    const navigation = useTypedNavigation();
    const state = engine.products.corp.use();

    const enroll = React.useCallback(async () => {
        await engine.products.corp.enroll();
    }, []);

    const phone = React.useCallback(() => {
        navigation.navigate('StartPhone');
    }, []);

    const kyc = React.useCallback(async () => {
        await startIDVerification(engine);
    }, []);

    if (state.status === 'need-enrolment') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ flexGrow: 1 }} />
                <FragmentMediaContent
                    animation={require('../../../assets/animations/chicken.json')}
                    title={'Whales Card'}
                    text={'First debit card that connects directly to your wallet.'}
                />
                <View style={{ height: 64 }} />
                <View style={{ flexDirection: 'row', marginHorizontal: 32 }}>
                    <RoundButton
                        title={'Start Application'}
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
    }
    if (state.status === 'need-phone') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ flexGrow: 1 }} />
                <Text style={{
                    fontSize: 30, fontWeight: '700',
                    textAlign: 'center',
                    marginTop: 26,
                    color: Theme.textColor
                }}>Your phone number</Text>

                <Text style={{ textAlign: 'center', marginHorizontal: 32, marginTop: 24 }}>
                    We need to verify your phone number to complete your application.
                </Text>

                <View style={{ height: 64 }} />
                <View style={{ flexDirection: 'row', marginHorizontal: 32 }}>
                    <RoundButton
                        title={'Start Verification'}
                        onPress={phone}
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
    }

    if (state.status === 'need-kyc') {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ flexGrow: 1 }} />
                <Text style={{
                    fontSize: 30, fontWeight: '700',
                    textAlign: 'center',
                    marginTop: 26,
                    color: Theme.textColor
                }}>Your Photo ID</Text>

                <Text style={{ textAlign: 'center', marginHorizontal: 32, marginTop: 24 }}>
                    We need to verify your identity to complete your application.
                </Text>

                <View style={{ height: 64 }} />
                <View style={{ flexDirection: 'row', marginHorizontal: 32 }}>
                    <RoundButton
                        title={'Start Verification'}
                        action={kyc}
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
    }

    return null;
});