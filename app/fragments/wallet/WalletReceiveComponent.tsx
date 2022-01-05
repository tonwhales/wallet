import * as React from 'react';
import { getAppState } from '../../utils/storage';
import QRCode from 'react-native-qrcode-svg';
import { Platform, Pressable, Share, Text, View } from 'react-native';
import { RoundButton } from '../../components/RoundButton';
import { Theme } from '../../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function WalletReceiveComponent() {
    const safeArea = useSafeAreaInsets();
    const address = React.useMemo(() => getAppState()!.address, []);
    const link = 'https://tonhub.com/transfer/' + address.toFriendly();

    return (
        <>
            <View style={{ alignSelf: 'stretch', flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center', paddingBottom: safeArea.bottom }}>
                <Text style={{ fontSize: 16, color: Theme.textSecondary, marginVertical: 32 }}>Share this link to receive Toncoin</Text>
                <Text style={{ fontSize: 16, color: Theme.textColor, textAlign: 'center', marginHorizontal: 16, marginBottom: 32 }} numberOfLines={1}>{link}</Text>
                <QRCode
                    size={260}
                    ecl="L"
                    value={link}
                    color={Theme.accent}
                />
                <Pressable onLongPress={() => { }}>
                    <Text style={{ fontSize: 16, color: Theme.textColor, marginTop: 32, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{address.toFriendly().slice(0, 24)}</Text>
                    <Text style={{ fontSize: 16, color: Theme.textColor, marginBottom: 32, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{address.toFriendly().slice(24, 48)}</Text>
                </Pressable>
                <RoundButton title="Share wallet address" onPress={() => Share.share({ url: link })} style={{ marginBottom: 32 }} />
            </View>
        </>
    );
}