import * as React from 'react';
import { fragment } from '../fragment';
import { getAppState } from '../utils/storage';
import QRCode from 'react-native-qrcode-svg';
import { Share, Text, View } from 'react-native';
import { RoundButton } from '../components/RoundButton';
import { Theme } from '../Theme';

export const WalletReceiveFragment = fragment(() => {
    const address = React.useMemo(() => getAppState()!.address, []);
    const link = 'ton://transfer/' + address.toFriendly();

    return (
        <View style={{ alignSelf: 'stretch', flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ flexGrow: 1 }} />
            <Text style={{ fontSize: 16, color: Theme.textSecondary, marginBottom: 32 }}>Share this link to receive Toncoin</Text>
            <QRCode
                size={260}
                ecl="L"
                value={link}
                color="#802216"
            />
            <Text style={{ fontSize: 16, color: Theme.textColor, marginTop: 32 }}>{address.toFriendly().slice(0, 24)}</Text>
            <Text style={{ fontSize: 16, color: Theme.textColor }}>{address.toFriendly().slice(24, 48)}</Text>
            <View style={{ flexGrow: 1 }} />
            <RoundButton title="Share wallet address" onPress={() => Share.share({ url: link })} />
            <View style={{ flexGrow: 1 }} />
        </View>
    );
});