import React from "react";
import { memo, useCallback } from "react";
import { Pressable, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../../components/Avatar";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { getAppState } from "../../../storage/appState";
import { resolveUrl } from "../../../utils/resolveUrl";
import { t } from "../../../i18n/t";
import { useLinkNavigator } from "../../../useLinkNavigator";
import { ReAnimatedCircularProgress } from "../../../components/CircularProgress/ReAnimatedCircularProgress";
import { CopilotStep } from "react-native-copilot";
import { OnboadingView } from "../../../components/onboarding/CopilotTooltip";
import { useAccountTransactions, useClient4, useNetwork, useSelectedAccount, useSyncState, useTheme } from "../../../engine/hooks";
import { useWalletSettings } from "../../../engine/hooks/appstate/useWalletSettings";

import Chart from '@assets/ic-chart.svg';
import Scanner from '@assets/ic-scan-white.svg';
import NoConnection from '@assets/ic-no-connection.svg';

export const WalletHeader = memo(() => {
    const network = useNetwork();
    const theme = useTheme();
    const linkNavigator = useLinkNavigator(network.isTestnet);
    const syncState = useSyncState();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const client = useClient4(network.isTestnet);

    const address = useSelectedAccount()!.address;
    const currentWalletIndex = getAppState().selected;
    const [walletSettings,] = useWalletSettings(address);

    const txs = useAccountTransactions(client, address.toString({ testOnly: network.isTestnet }))?.data;

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, network.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch (error) {
            // Ignore
        }
    };
    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);
    const openGraph = useCallback(() => {
        if (!!txs && (txs.length > 0)) {
            navigation.navigate('AccountBalanceGraph');
        }
    }, [txs]);
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
                paddingVertical: 6
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
                    <CopilotStep
                        text={t('onboarding.avatar')}
                        order={1}
                        name={'firstStep'}
                    >
                        <OnboadingView style={{
                            width: 24, height: 24,
                            backgroundColor: theme.accent,
                            borderRadius: 12
                        }}>
                            <Avatar
                                id={address.toString({ testOnly: network.isTestnet })}
                                size={24}
                                borderWith={0}
                                hash={walletSettings?.avatar}
                            />
                        </OnboadingView>
                    </CopilotStep>
                </Pressable>
                <Pressable
                    onPress={onAccountPress}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: '30%' }}
                >
                    <CopilotStep
                        text={t('onboarding.wallet')}
                        order={2}
                        name={'secondStep'}
                    >
                        <OnboadingView style={{
                            flexDirection: 'row',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderRadius: 32, paddingHorizontal: 12, paddingVertical: 4,
                            alignItems: 'center'
                        }}>
                            <Text
                                style={{
                                    fontWeight: '500',
                                    fontSize: 17, lineHeight: 24,
                                    color: theme.textThird, flexShrink: 1,
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
                                    color={theme.textThird}
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
                        </OnboadingView>
                    </CopilotStep>
                </Pressable>
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    {(!!txs && txs.length > 0) && (
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
                                color={theme.iconPrimary}
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
                            color={theme.iconPrimary}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
});