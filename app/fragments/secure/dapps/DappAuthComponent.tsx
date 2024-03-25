import { memo, useCallback, useMemo, useState } from "react";
import { AppManifest } from "../../../engine/api/fetchManifest";
import { ConnectRequest } from "@tonconnect/protocol";
import { ReturnStrategy } from "../../../engine/tonconnect/types";
import { AppData } from "../../../engine/api/fetchAppData";
import { Platform, View, Text, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { WImage } from "../../../components/WImage";
import { getCurrentAddress } from "../../../storage/appState";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { useImageColors } from "../../../utils/useImageColors";
import { AndroidImageColors, IOSImageColors } from "react-native-image-colors/build/types";
import { Canvas, ImageSVG, Skia } from "@shopify/react-native-skia";
import { CheckBox } from "../../../components/CheckBox";
import { useTheme, useAppState, useBounceableWalletFormat, useNetwork } from "../../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { SelectedAccount } from "../../../engine/types";
import { Typography } from "../../../components/styles";
import { ScrollView } from "react-native-gesture-handler";
import { WalletItem } from "../../../components/wallet/WalletItem";
import { Address } from "@ton/core";
import Collapsible from "react-native-collapsible";
import Animated, { FadeOutDown } from "react-native-reanimated";

import TonhubLogo from '@assets/tonhub-logo.svg';
import IcConnectLine from '@assets/ic-connect-line.svg';

export type TonConnectSignState =
    { type: 'loading' }
    | { type: 'expired', returnStrategy?: ReturnStrategy }
    | {
        type: 'initing',
        name: string,
        url: string,
        app: AppManifest,
        protocolVersion: number,
        request: ConnectRequest,
        clientSessionId?: string,
        returnStrategy?: ReturnStrategy
    }
    | { type: 'completed', returnStrategy?: ReturnStrategy }
    | { type: 'authorized', returnStrategy?: ReturnStrategy }
    | { type: 'failed', returnStrategy?: ReturnStrategy }

export type TonXSignState =
    { type: 'loading' }
    | { type: 'expired' }
    | { type: 'initing', name: string, url: string, app?: AppData | null }
    | { type: 'completed' }
    | { type: 'authorized' }
    | { type: 'failed' }


export type SignState =
    ({ connector: 'ton-connect' } & TonConnectSignState)
    | ({ connector: 'ton-x' } & TonXSignState);


export const DappAuthComponent = memo(({
    state,
    onApprove,
    onCancel,
    addExtension,
    setAddExtension,
    single
}: {
    state: SignState,
    onApprove: (selectedAccount?: SelectedAccount) => Promise<void>,
    onCancel?: () => void,
    addExtension?: boolean,
    setAddExtension?: (add: boolean) => void,
    single?: boolean
}) => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const appState = useAppState();
    const [bounceableFormat,] = useBounceableWalletFormat();
    const { isTestnet } = useNetwork();
    const accounts = useMemo(() => appState.addresses
        .map((a, i) => ({ ...a, index: i }))
        .sort((a, b) => {
            if (a.index === appState.selected) {
                return -1;
            } else if (b.index === appState.selected) {
                return 1;
            }
            return 0;
        }), [appState]);

    const [showMore, setShowMore] = useState(appState.addresses.length > 2 ? false : true);
    const [selectedAccount, setSelectedAccount] = useState(getCurrentAddress());

    const onAddressSelected = useCallback((address: Address) => {
        const account = appState.addresses.find((a) => a.address.equals(address));
        if (!!account) {
            setSelectedAccount(account);
        }
    }, [appState]);

    const doApprove = useCallback(async () => {
        await onApprove(selectedAccount);
    }, [selectedAccount, onApprove]);

    const iconUrl = useMemo(() => {
        if (state.type === 'initing') {
            return state.connector === 'ton-connect' ? state.app?.iconUrl : state.app?.image?.preview256;
        }
        return undefined;
    }, [state]);

    const domain = useMemo(() => {
        if (state.type !== 'initing') {
            return '';
        }
        try {
            return extractDomain(state.app ? state.app.url : state.url);
        } catch {
            return '';
        }
    }, [state]);

    const dAppIconColors = useImageColors(iconUrl);
    const primaryIconColor = useMemo(() => {
        if (!dAppIconColors) {
            return '#3CADF5';
        }

        let color = Platform.select({
            android: (dAppIconColors as AndroidImageColors).dominant,
            ios: (dAppIconColors as IOSImageColors).primary,
        }) || '#3CADF5';

        if (color === '#FFFFFF' || color === '#E4E6EA') {
            color = Platform.select({
                android: (dAppIconColors as AndroidImageColors).average,
                ios: (dAppIconColors as IOSImageColors).background,
            }) || '#3CADF5'
        }

        return color;
    }, [dAppIconColors]);

    const connectLineSvg = useMemo(() => {
        return Skia.SVG.MakeFromString(
            `<svg xmlns="http://www.w3.org/2000/svg" width="79" height="51" viewBox="0 0 79 51" fill="none">
            <path d="M16.8405 23.9492C16.8405 23.9492 16.9389 26.6872 15.0678 28.1756C13.1967 29.6641 11.3008 29.6641 11.3008 29.6641M27.9199 44.4336V37.0488V25.5M38.9994 44.4336V31.5" stroke="${primaryIconColor}" stroke-width="4" stroke-linecap="round"/>
            <path d="M61.1595 33.6797V27.5195C61.1595 27.5195 61.0611 24.7815 62.9322 23.2931C64.8033 21.8047 66.6992 21.8047 66.6992 21.8047M50.0801 11.9688V26.9688M39.0006 7.96875V15.3215V16.9688" stroke="url(#paint0_linear_11710_129036)" stroke-width="4" stroke-linecap="round"/>
            <defs>
              <linearGradient id="paint0_linear_11710_129036" x1="40.8466" y1="30.9336" x2="80.2159" y2="30.9336" gradientUnits="userSpaceOnUse">
                <stop stop-color="${primaryIconColor}"/>
                <stop offset="0.497277" stop-color="#6E49FD"/>
              </linearGradient>
            </defs>
          </svg>`
        )!;
    }, [primaryIconColor]);

    const description = useMemo(() => {
        if (state.type === 'initing') {
            return `${domain[0].toLocaleUpperCase()}${domain.slice(1)} ${t('auth.message', { wallet: '' })}`;
        }
    }, [state, domain]);

    return (
        <View style={[
            { flexGrow: 1 },
            Platform.select({
                android: { 
                    backgroundColor: theme.backgroundPrimary,
                    paddingTop: safeArea.top
                },
                ios: { backgroundColor: theme.elevation }
            })
        ]}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                onClosePressed={onCancel}
                onBackPressed={!onCancel ? navigation.goBack : undefined}
                title={t('install.title')}
            />
            <View style={[
                {
                    flexGrow: 1,
                    paddingHorizontal: 16,
                    paddingBottom: safeArea.bottom + 16
                },
                Platform.select({
                    ios: { backgroundColor: theme.elevation },
                    android: { backgroundColor: theme.backgroundPrimary }
                })
            ]}>
                <View style={Platform.select({ android: { flexGrow: single ? 1 : 0 } })}>
                    <View style={{
                        borderRadius: 20,
                        width: '100%',
                        paddingVertical: 48,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                    }}>
                        <WImage
                            heigh={72}
                            width={72}
                            src={iconUrl}
                            borderRadius={16}
                        />
                        <View style={{ width: 79, height: 51 }}>
                            <IcConnectLine
                                height={50}
                                width={80}
                                style={{ width: 80, height: 50 }}
                            />
                            <Canvas style={{ position: 'absolute', top: -1, left: 0.2, right: 0, bottom: 0 }}>
                                <ImageSVG
                                    svg={connectLineSvg}
                                    x={0}
                                    y={0}
                                    width={79}
                                    height={51}
                                />
                            </Canvas>
                        </View>
                        <TonhubLogo
                            height={72}
                            width={72}
                            style={{ height: 72, width: 72 }}
                        />
                    </View>
                    {state.type === 'loading' ? (
                        <>
                            <View style={{
                                width: 120, height: 34,
                                marginBottom: 12,
                                backgroundColor: theme.textSecondary,
                                borderRadius: 12, opacity: 0.7
                            }} />
                            <View style={{
                                width: '100%', height: 24,
                                backgroundColor: theme.textSecondary,
                                borderTopLeftRadius: 12,
                                borderTopRightRadius: 12,
                                borderBottomRightRadius: 12,
                                opacity: 0.7
                            }} />
                            <View style={{
                                width: 120, height: 24,
                                marginBottom: 36,
                                backgroundColor: theme.textSecondary,
                                borderBottomLeftRadius: 12,
                                borderBottomRightRadius: 12,
                                opacity: 0.7
                            }} />
                        </>
                    ) : (
                        <>
                            <Text style={[{ color: theme.textPrimary, textAlign: 'center', marginTop: 10 }, Typography.semiBold27_32]}>
                                {description}
                            </Text>
                            {state.type === 'initing' && !!setAddExtension && (
                                <CheckBox
                                    checked={addExtension}
                                    onToggle={setAddExtension}
                                    text={t('auth.apps.installExtension')}
                                    style={{
                                        paddingHorizontal: 24,
                                        marginBottom: 32,
                                        width: '100%'
                                    }}
                                />
                            )}
                        </>
                    )}
                </View>
                {single ? (
                    <>
                        <WalletItem
                            index={0}
                            address={selectedAccount.address}
                            onSelect={onAddressSelected}
                            style={{ marginBottom: 0, marginTop: 16 }}
                            hideSelect
                            bounceableFormat={bounceableFormat}
                            isTestnet={isTestnet}
                        />
                        <View style={{ flexGrow: 1 }} />
                    </>
                ) : (
                    <ScrollView
                        style={
                            [
                                { flexBasis: 0 },
                                Platform.select({ android: { marginTop: 24 } })
                            ]
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ gap: 16 }}
                        contentInset={{ top: 24 }}
                    >
                        {accounts.slice(0, 2).map((addr, index) => {
                            return (
                                <WalletItem
                                    key={addr.address.toString()}
                                    index={addr.index}
                                    selected={selectedAccount?.address.equals(addr.address)}
                                    address={addr.address}
                                    onSelect={onAddressSelected}
                                    style={{ marginBottom: 0 }}
                                    bounceableFormat={bounceableFormat}
                                    isTestnet={isTestnet}
                                />
                            )
                        })}
                        {!showMore && (
                            <Animated.View
                                exiting={FadeOutDown}
                            >
                                <Text
                                    style={[{ color: theme.accent }, Typography.medium15_20]}
                                    onPress={() => setShowMore(!showMore)}
                                >
                                    {t('auth.apps.moreWallets', { count: accounts.length - 2 })}
                                </Text>
                            </Animated.View>
                        )}
                        <Collapsible collapsed={!showMore}>
                            {accounts.slice(2).map((addr, index) => {
                                return (
                                    <WalletItem
                                        key={addr.address.toString()}
                                        index={addr.index}
                                        selected={selectedAccount?.address.equals(addr.address)}
                                        address={addr.address}
                                        onSelect={onAddressSelected}
                                        bounceableFormat={bounceableFormat}
                                        isTestnet={isTestnet}
                                    />
                                );
                            })}
                        </Collapsible>
                    </ScrollView>
                )}
                <View>
                    <View style={{ flexDirection: 'row', marginBottom: 24 }}>
                        <Image
                            source={require('@assets/ic-shield-chekmark.png')}
                            style={{
                                height: 24,
                                width: 24,
                            }}
                        />
                        <Text style={[Typography.regular13_18, { color: theme.textSecondary, marginTop: 4, flexShrink: 1 }]}>
                            {t('auth.apps.connectionSecureDescription')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', width: '100%' }}>
                        <RoundButton
                            style={{ marginBottom: 16, flex: 1, marginRight: 16 }}
                            display={'secondary'}
                            disabled={!onCancel}
                            title={t('common.cancel')}
                            onPress={onCancel}
                        />
                        <RoundButton
                            style={{ marginBottom: 16, flex: 1 }}
                            title={t('common.connect')}
                            disabled={state.type !== 'initing'}
                            action={doApprove}
                            loading={state.type === 'loading'}
                        />
                    </View>
                </View>
            </View>
        </View >
    );
});