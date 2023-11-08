import { memo, useCallback } from "react";
import { Pressable, View, Text, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { resolveUrl } from "../../../utils/resolveUrl";
import { t } from "../../../i18n/t";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";
import { useNetwork, useSyncState, useTheme } from "../../../engine/hooks";

import Scanner from '@assets/ic-scan-white.svg';
import NoConnection from '@assets/ic-no-connection.svg';

export const LedgerWalletHeader = memo(() => {
    const theme = useTheme();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const syncState = useSyncState();

    const onQRCodeRead = useCallback((src: string) => {
        try {
            let res = resolveUrl(src, network.isTestnet);
            if (res && (res.type === 'jetton-transaction' || res.type === 'transaction')) {
                if (res.type === 'transaction') {
                    if (res.payload) {
                        // TODO: implement
                        // navigation.navigateLedgerSignTransfer({
                        //     order: {
                        //         target: res.address.toString({ testOnly: network.isTestnet }),
                        //         amount: res.amount || 0n,
                        //         amountAll: false,
                        //         stateInit: res.stateInit,
                        //         payload: {
                        //             type: 'unsafe',
                        //             message: new CellMessage(res.payload),
                        //         },
                        //     },
                        //     text: res.comment
                        // });
                    } else {
                        navigation.navigateLedgerTransfer({
                            target: res.address.toString({ testOnly: network.isTestnet }),
                            comment: res.comment,
                            amount: res.amount,
                            stateInit: res.stateInit,
                            job: null,
                            jetton: null,
                            callback: null
                        });
                    }
                    return;
                }
                navigation.navigateLedgerTransfer({
                    target: res.address.toString({ testOnly: network.isTestnet }),
                    comment: res.comment,
                    amount: res.amount,
                    stateInit: null,
                    job: null,
                    jetton: res.jettonMaster.toString({ testOnly: network.isTestnet }),
                    callback: null
                });
            }
        } catch {
            // Ignore
        }
    }, []);
    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);
    const onAccountPress = useCallback(() => {
        navigation.navigate('AccountSelector');
    }, []);


    return (
        <View
            style={{
                backgroundColor: theme.backgroundUnchangeable,
                paddingTop: safeArea.top,
                paddingHorizontal: 16
            }}
            collapsable={false}
        >
            <View style={{
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Pressable
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1,
                            flex: 1
                        }
                    }}
                    onPress={() => navigation.navigate('WalletSettings')}
                >
                    <View style={{
                        width: 24, height: 24,
                        backgroundColor: theme.accent,
                        borderRadius: 12
                    }}>
                        <Image
                            style={{ width: 24, height: 24 }}
                            source={require('@assets/ledger_device.png')}
                        />
                    </View>
                </Pressable>
                <Pressable
                    onPress={onAccountPress}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: '30%' }}
                >
                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 32, paddingHorizontal: 12, paddingVertical: 4,
                        alignItems: 'center'
                    }}>
                        <Text
                            style={{
                                fontWeight: '500',
                                fontSize: 17, lineHeight: 24,
                                color: theme.white, flexShrink: 1,
                                marginRight: 8
                            }}
                            ellipsizeMode='tail'
                            numberOfLines={1}
                        >
                            {t('hardwareWallet.ledger')}
                        </Text>
                        {syncState === 'updating' && (
                            <ReAnimatedCircularProgress
                                size={14}
                                color={theme.white}
                                reverse
                                infinitRotate
                                progress={0.8}
                            />
                        )}
                        {syncState === 'connecting' && (
                            <NoConnection
                                height={16}
                                width={16}
                                style={{ height: 16, width: 16 }}
                            />
                        )}
                        {syncState === 'online' && (
                            <View style={{ height: 16, width: 16, justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{ backgroundColor: theme.accentGreen, width: 8, height: 8, borderRadius: 4 }} />
                            </View>
                        )}
                    </View>
                </Pressable>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    <Pressable
                        style={({ pressed }) => { return { opacity: pressed ? 0.5 : 1 } }}
                        onPress={openScanner}
                    >
                        <Scanner
                            style={{
                                height: 24,
                                width: 24,
                                marginLeft: 14
                            }}
                            height={24}
                            width={24}
                            color={theme.iconPrimary}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
});