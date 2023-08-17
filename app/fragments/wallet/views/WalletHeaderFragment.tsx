import { memo, useCallback, useMemo } from "react";
import { Pressable, View, Text } from "react-native";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../../components/Avatar";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useBottomSheet } from '../../../components/modal/BottomSheetModal';
import { useEngine } from "../../../engine/Engine";
import { getAppState, getCurrentAddress } from "../../../storage/appState";
import { resolveUrl } from "../../../utils/resolveUrl";
import { t } from "../../../i18n/t";
import { useLinkNavigator } from "../../../useLinkNavigator";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";

import Chart from '../../../../assets/ic-chart.svg';
import Scanner from '../../../../assets/ic-scan-white.svg';
import NoConnection from '../../../../assets/ic-no-connection.svg';

export const WalletHeaderFragment = memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    const address = useMemo(() => getCurrentAddress().address, []);
    const currentWalletIndex = getAppState().selected;
    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);
    const walletSettings = engine.products.wallets.useWalletSettings(address);
    const safeArea = useSafeAreaInsets();
    const modal = useBottomSheet();
    const navigation = useTypedNavigation();
    const txs = useMemo(() => account?.transactions ?? [], [account]);
    const syncState = engine.state.use();

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, AppConfig.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch (error) {
            // Ignore
        }
    };
    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);
    const openGraph = useCallback(() => {
        if (txs.length > 0) {
            navigation.navigate('AccountBalanceGraph');
        }
    }, [account]);
    const onAccountPress = useCallback(() => {
        navigation.navigate('AccountSelector');
    }, [modal]);

    return (
        <View
            style={{
                backgroundColor: Theme.walletBackground,
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
                        <Avatar
                            id={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                            size={24}
                            borderWith={0}
                            hash={walletSettings?.avatar}
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
                            {walletSettings?.name || `${t('common.wallet')} ${currentWalletIndex + 1}`}
                        </Text>
                        {syncState === 'updating' && (
                            <ReAnimatedCircularProgress
                                size={14}
                                color={Theme.white}
                                loop
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
                                <View style={{ backgroundColor: Theme.green, width: 8, height: 8, borderRadius: 4 }} />
                            </View>
                        )}
                    </View>
                </Pressable>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    {txs.length > 0 && (
                        <Pressable
                            style={({ pressed }) => { return { opacity: pressed ? 0.5 : 1 } }}
                            onPress={openGraph}
                        >
                            <Chart
                                style={{
                                    height: 24,
                                    width: 24,
                                }}
                                height={24}
                                width={24}
                                color={Theme.greyForIcon}
                            />
                        </Pressable>
                    )}
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
                            color={Theme.greyForIcon}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
});