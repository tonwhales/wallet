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
                <View style={{ height: 50, alignItems: 'center', flexDirection: 'row' }}>
                    <View style={{ flexGrow: 1 }} />
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17 }}>Receive Toncoin</Text>
                    <View style={{ flexGrow: 1, alignItems: 'flex-end', marginRight: 16, flexBasis: 0 }}>
                        {/* <Text style={{ color: Theme.accent, fontWeight: '600', fontSize: 17 }}>Done</Text> */}
                    </View>
                </View>
                <Text style={{ fontSize: 16, color: Theme.textSecondary, marginVertical: 32 }}>Share this link to receive Toncoin</Text>
                <QRCode
                    size={200}
                    ecl="L"
                    value={link}
                    color={'black'}
                />
                <Text selectable={true} style={{ marginTop: 32, marginBottom: 72, width: 265, textAlign: 'center' }} numberOfLines={2}>
                    <Text style={{ fontSize: 18, color: Theme.textColor, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{address.toFriendly().slice(0, 24)}</Text>
                    <Text style={{ fontSize: 18, color: Theme.textColor, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{address.toFriendly().slice(24, 48)}</Text>
                </Text>
                <RoundButton title="Share wallet address" onPress={() => Share.share({ url: link })} style={{ marginBottom: 16, alignSelf: 'stretch', marginHorizontal: 16 }} />
            </View>
        </>
    );
}