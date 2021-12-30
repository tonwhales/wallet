import * as React from 'react';
import { fragment } from '../fragment';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { Text, View } from 'react-native';
import { mnemonicNew } from 'ton-crypto';
import { minimumDelay } from 'teslabot';

export const WalletCreateFragment = fragment(() => {
    const [created, setCreated] = React.useState(false);
    React.useEffect(() => {
        (async () => {

            // Nice minimum delay for smooth animations
            // and secure feeling of key generation process
            // It is a little bit random - sometimes it takes few seconds, sometimes few milliseconds
            await minimumDelay(2500, (async () => {
                await mnemonicNew();
            })());

            setCreated(true);
        })()
    }, []);

    if (!created) {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                <LoadingIndicator />
                <Text style={{ marginTop: 16, fontSize: 24, marginHorizontal: 16 }}>Generating secure key...</Text>
            </View>
        );
    } else {
        return (
            <>

            </>
        );
    }
});