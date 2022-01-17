import * as React from 'react';
import { getAppState } from '../../utils/storage';
import QRCode from 'react-native-qrcode-svg';
import { Platform, Pressable, Share, Text, View, Image } from 'react-native';
import { RoundButton } from '../../components/RoundButton';
import { Theme } from '../../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from "react-i18next";
import Clipboard from '@react-native-clipboard/clipboard';
import { CloseButton } from '../../components/CloseButton';

export function WalletReceiveComponent(props: { onHide?: () => void }) {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const address = React.useMemo(() => getAppState()!.address, []);
    const link = 'https://tonhub.com/transfer/' + address.toFriendly();

    const onCopy = React.useCallback(
        () => {
            Clipboard.setString(link);
        },
        [link],
    );

    return (
        <>
            <View style={{ alignSelf: 'stretch', flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12 }}>
                    {t("Receive Toncoin")}
                </Text>
                <Text style={{ fontSize: 16, color: Theme.textSecondary, marginVertical: 7, textAlign: 'center' }}>
                    {t("Share this link to receive Toncoin")}
                </Text>
                <QRCode
                    size={202}
                    ecl="L"
                    value={link}
                    color={'#303757'}
                    logo={require('../../../assets/ic_qr_logo.png')}
                    logoMargin={4}
                    logoSize={40}
                    logoBackgroundColor='transparent'
                />
                <Text selectable={true} style={{ marginTop: 25, width: 265, textAlign: 'center' }} numberOfLines={1} ellipsizeMode="middle">
                    <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textColor, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{address.toFriendly()}</Text>
                </Text>
                <Text style={{ fontSize: 16, color: Theme.textSecondary, textAlign: 'center', marginBottom: 72, marginTop: 6 }}>
                    {t("Wallet address")}
                </Text>
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={props.onHide}
                />
                <View style={{
                    flex: 2,
                    flexDirection: 'row',
                    paddingHorizontal: 16, marginBottom: 8,
                    justifyContent: 'space-evenly',
                    position: 'absolute', bottom: 0,
                    alignContent: 'stretch'
                }}>
                    <RoundButton
                        title={t("Copy")}
                        onPress={onCopy}
                        style={{ flex: 2, marginRight: 16, alignSelf: 'stretch' }}
                        display={'secondary'}
                    />
                    <RoundButton
                        title={t("Share QR code")}
                        onPress={() => Share.share({ url: link })}
                        style={{ flex: 2, alignSelf: 'stretch' }}
                    />
                </View>
            </View>
        </>
    );
}