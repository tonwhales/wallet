import { memo, useCallback } from "react";
import { Pressable, View, Text, Image } from "react-native";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useBottomSheet } from '../../../components/modal/BottomSheetModal';
import { useEngine } from "../../../engine/Engine";
import { resolveUrl } from "../../../utils/resolveUrl";
import { t } from "../../../i18n/t";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";
import { CellMessage } from "ton";
import BN from "bn.js";

import Scanner from '@assets/ic-scan-white.svg';
import NoConnection from '@assets/ic-no-connection.svg';

export const LedgerWalletHeader = memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const account = engine.products.ledger.useAccount();
    const safeArea = useSafeAreaInsets();
    const modal = useBottomSheet();
    const navigation = useTypedNavigation();
    const syncState = engine.state.use();

    const onQRCodeRead = useCallback((src: string) => {
        try {
            let res = resolveUrl(src, AppConfig.isTestnet);
            if (res && (res.type === 'jetton-transaction' || res.type === 'transaction')) {
                if (res.type === 'transaction') {
                    if (res.payload) {
                        navigation.navigateLedgerSignTransfer({
                            order: {
                                target: res.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                amount: res.amount || new BN(0),
                                amountAll: false,
                                stateInit: res.stateInit,
                                payload: {
                                    type: 'unsafe',
                                    message: new CellMessage(res.payload),
                                },
                            },
                            text: res.comment
                        });
                    } else {
                        navigation.navigateLedgerTransfer({
                            target: res.address.toFriendly({ testOnly: AppConfig.isTestnet }),
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
                    target: res.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                    comment: res.comment,
                    amount: res.amount,
                    stateInit: null,
                    job: null,
                    jetton: res.jettonMaster,
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
    }, [modal]);


    return (
        <View
            style={{
                backgroundColor: Theme.backgroundUnchangeable,
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
                        backgroundColor: Theme.accent,
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
                                color: Theme.white, flexShrink: 1,
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
                                color={Theme.white}
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
                                <View style={{ backgroundColor: Theme.accentGreen, width: 8, height: 8, borderRadius: 4 }} />
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
                            color={Theme.iconPrimary}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
});