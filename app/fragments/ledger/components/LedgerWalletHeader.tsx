import { memo, useCallback } from "react";
import { Pressable, View, Text, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { resolveUrl } from "../../../utils/resolveUrl";
import { useNetwork, useTheme } from '../../../engine/hooks';
import { useLedgerTransport } from "./TransportContext";
import { Address } from "@ton/core";
import { HeaderSyncStatus } from "../../wallet/views/HeaderSyncStatus";
import { Typography } from "../../../components/styles";

export const LedgerWalletHeader = memo(({ address }: { address: Address }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();

    const onQRCodeRead = useCallback((src: string) => {
        try {
            let res = resolveUrl(src, isTestnet);
            
            if (res && (res.type === 'jetton-transaction' || res.type === 'transaction')) {
                const bounceable = res.isBounceable ?? true;
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
                        navigation.navigateSimpleTransfer({
                            target: res.address.toString({ testOnly: isTestnet, bounceable }),
                            comment: res.comment,
                            amount: res.amount,
                            stateInit: res.stateInit,
                            jetton: null,
                            callback: null
                        }, { ledger: true });
                    }
                    return;
                }

                navigation.navigateSimpleTransfer({
                    target: res.address.toString({ testOnly: isTestnet, bounceable }),
                    comment: res.comment,
                    amount: res.amount,
                    stateInit: null,
                    jetton: res.jettonMaster,
                    callback: null
                }, { ledger: true });
            }
        } catch {
            // Ignore
        }
    }, []);
    const openScanner = () => navigation.navigateScanner({ callback: onQRCodeRead });
    const onAccountPress = () => navigation.navigate('AccountSelector');

    return (
        <View
            style={{
                backgroundColor: theme.backgroundUnchangeable,
                paddingTop: safeArea.top + (Platform.OS === 'ios' ? 0 : 16),
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
                <View style={{ flex: 1 }}>
                    <View style={{
                        width: 32, height: 32,
                        backgroundColor: theme.accent,
                        borderRadius: 16
                    }}>
                        <Image
                            style={{ width: 32, height: 32 }}
                            source={require('@assets/ledger_device.png')}
                        />
                    </View>
                </View>
                <Pressable
                    onPress={onAccountPress}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: '30%' }}
                >
                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                        borderRadius: 32, paddingHorizontal: 12, paddingVertical: 4,
                        alignItems: 'center'
                    }}>
                        <Text
                            style={[{
                                color: theme.style === 'light' ? theme.textOnsurfaceOnDark : theme.textPrimary,
                                flexShrink: 1,
                                marginRight: 8
                            }, Typography.medium17_24]}
                            ellipsizeMode='tail'
                            numberOfLines={1}
                        >
                            {ledgerContext.ledgerName}
                        </Text>
                        <HeaderSyncStatus
                            address={address.toString({ testOnly: isTestnet })}
                            isLedger={true}
                        />
                    </View>
                </Pressable>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    <Pressable
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                            height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                            borderRadius: 16
                        })}
                        onPress={openScanner}
                    >
                        <Image
                            source={require('@assets/ic-scan-main.png')}
                            style={{
                                height: 22,
                                width: 22,
                                tintColor: theme.iconPrimary
                            }}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
});