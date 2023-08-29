import React, { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { View, Platform, Text, Pressable } from "react-native";
import { CloseButton } from "../../components/CloseButton";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { t } from "../../i18n/t";
import { StatusBar } from "expo-status-bar";
import { QRCode } from "../../components/QRCode/QRCode";
import { useParams } from "../../utils/useParams";
import TonIcon from '../../../assets/ic_ton_account.svg';
import { CopyButton } from "../../components/CopyButton";
import { ShareButton } from "../../components/ShareButton";
import { Address } from "ton";
import Chevron from '../../../assets/ic_chevron_forward.svg';
import { WImage } from "../../components/WImage";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from '../../engine/hooks/useTheme';
import { JettonMasterState } from '../../engine/legacy/sync/startJettonMasterSync';

export const ReceiveFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const params = useParams<{ addr?: string, ledger?: boolean }>();
    const address = React.useMemo(() => {
        if (params.addr) {
            return Address.parse(params.addr);
        }
        return getCurrentAddress().address;
    }, [params]);
    const friendly = address.toFriendly({ testOnly: isTestnet });
    const [jetton, setJetton] = useState<{ master: Address, data: JettonMasterState } | null>(null);

    const onAssetSelected = useCallback((address?: Address) => {
        // if (address) {
        //     const data = engine.persistence.jettonMasters.item(address).value;
        //     if (data) {
        //         setJetton({ master: address, data });
        //         return;
        //     }
        // }
        setJetton(null);
    }, []);

    const link = useMemo(() => {
        if (jetton) {
            return `https://${isTestnet ? 'test.' : ''}tonhub.com/transfer`
                + `/${address.toFriendly({ testOnly: isTestnet })}`
                + `?jetton=${jetton.master.toFriendly({ testOnly: isTestnet })}`
        }
        return `https://${isTestnet ? 'test.' : ''}tonhub.com/transfer`
            + `/${address.toFriendly({ testOnly: isTestnet })}`
    }, [jetton]);

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top }} pageTitle={t('receive.title')} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 17 }}>
                        {t('receive.title')}
                    </Text>
                )}
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ padding: 16, width: '100%' }}>
                <View style={{
                    justifyContent: 'center',
                    backgroundColor: theme.item, borderRadius: 20,
                    marginHorizontal: 16, padding: 14,
                    minHeight: 358
                }}>
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.3 : 1,
                            }
                        }}
                        onPress={() => {
                            if (params.ledger) {
                                navigation.navigate('LedgerAssets', { callback: onAssetSelected });
                                return;
                            }
                            navigation.navigate('Assets', { callback: onAssetSelected });
                        }}
                    >
                        <View style={{
                            marginBottom: 40,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <View style={{
                                flexDirection: 'row',
                            }}>
                                {!!jetton && (
                                    <WImage
                                        src={jetton.data.image?.preview256}
                                        blurhash={jetton.data.image?.blurhash}
                                        width={42}
                                        heigh={42}
                                        borderRadius={21}
                                        style={{ marginRight: 10 }}
                                        lockLoading
                                    />
                                )}
                                {!jetton && (
                                    <TonIcon width={42} height={42} style={{ marginRight: 10 }} />
                                )}
                                <View style={{ justifyContent: 'space-between' }}>
                                    <Text style={{
                                        fontSize: 16,
                                        color: theme.textColor, fontWeight: '600',
                                    }}>
                                        {`${jetton?.data.symbol ?? `TON ${t('common.wallet')}`}`}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontWeight: '400',
                                            color: theme.price,
                                        }}
                                        selectable={false}
                                        ellipsizeMode={'middle'}
                                    >
                                        {
                                            friendly.slice(0, 6)
                                            + '...'
                                            + friendly.slice(friendly.length - 6)
                                        }
                                    </Text>
                                </View>
                            </View>
                            <Chevron />
                        </View>
                    </Pressable>
                    <View style={{ height: 240, marginBottom: 38, justifyContent: 'center', alignItems: 'center' }}>
                        <QRCode
                            data={link}
                            size={Platform.OS === 'ios' ? 260 : 240}
                            icon={jetton?.data.image}
                        />
                    </View>

                    <View style={{
                        justifyContent: 'center'
                    }}>
                        <CopyButton
                            body={address.toFriendly({ testOnly: isTestnet })}
                            style={{ marginBottom: 8 }}
                        />
                        <ShareButton body={link} />
                    </View>
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});