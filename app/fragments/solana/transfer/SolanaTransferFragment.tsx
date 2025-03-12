import { Platform, ScrollView, View, Text, Pressable } from "react-native";
import { fragment } from "../../../fragment";
import { useParams } from "../../../utils/useParams";
import { SolanaOrder } from "../../secure/ops/Order"
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { useSolanaClient, useSolanaSelectedAccount, useSolanaToken, useTheme } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ItemGroup } from "../../../components/ItemGroup";
import { Typography } from "../../../components/styles";
import { t } from "../../../i18n/t";
import { useCallback } from "react";
import { copyText } from "../../../utils/copyText";
import { ToastDuration, useToaster } from "../../../components/toast/ToastProvider";
import { RoundButton } from "../../../components/RoundButton";
import { sendSolanaTransfer } from "../../../utils/solana/sendSolanaTransfer";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { AddressInputAvatar } from "../../../components/address/AddressInputAvatar";
import { avatarHash } from "../../../utils/avatarHash";
import { avatarColors } from "../../../components/avatar/Avatar";
import { SolanaWalletAddress } from "../../../components/address/SolanaWalletAddress";
import { fromNano } from "@ton/core";
import { fromBnWithDecimals, toBnWithDecimals } from "../../../utils/withDecimals";

export type SolanaTransferParams = {
    order: SolanaOrder
}


const TransferLoaded = ({ order }: SolanaTransferParams) => {
    const theme = useTheme();
    const toaster = useToaster();
    const solanaClient = useSolanaClient();
    const authContext = useKeysAuth();
    const solanaAddress = useSolanaSelectedAccount()!;
    const navigation = useTypedNavigation();
    const token = useSolanaToken(solanaAddress, order.token);

    const onCopyAddress = useCallback((address: string) => {
        copyText(address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, []);

    const doSend = useCallback(async () => {
        await sendSolanaTransfer({
            solanaClient,
            theme,
            authContext,
            order,
            sender: solanaAddress
        });
        navigation.goBack();
    }, [theme, authContext, order, solanaAddress, navigation]);

    const avatarColorHash = avatarHash(order.target, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const amount = token ? fromBnWithDecimals(order.amount, token.decimals) : fromNano(order.amount);
    const amountText = amount + ' ' + (token?.symbol ?? 'SOL');

    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                alwaysBounceVertical={false}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>
                    <ItemGroup style={{ marginBottom: 16, marginTop: 16, paddingTop: 27 }}>
                        <View style={{
                            backgroundColor: theme.divider,
                            height: 54,
                            position: 'absolute', left: 0, right: 0
                        }} />
                        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 68, flexDirection: 'row', height: 68 }}>
                                <AddressInputAvatar
                                    size={68}
                                    theme={theme}
                                    isOwn={false}
                                    markContact={false}
                                    // hash={walletSettings?.avatar}
                                    friendly={order.target}
                                    avatarColor={avatarColor}
                                    knownWallets={{}}
                                    hash={null}
                                // forceAvatar={!!isTargetHolders ? 'holders' : undefined}
                                />
                            </View>
                        </View>
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={[{ color: theme.textPrimary, marginTop: 8 }, Typography.semiBold17_24]}>
                                {t('common.send')}
                            </Text>
                            <Text style={[{ color: theme.textPrimary, marginTop: 2 }, Typography.regular17_24]}>
                                <SolanaWalletAddress
                                    address={order.target}
                                    elipsise={{ start: 4, end: 4 }}
                                    copyOnPress
                                    disableContextMenu
                                    copyToastProps={{ marginBottom: 70 }}
                                />
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 26, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                            <Text
                                minimumFontScale={0.4}
                                adjustsFontSizeToFit={true}
                                numberOfLines={1}
                                style={[{ color: theme.textPrimary, marginTop: 12 }, Typography.semiBold27_32]}
                            >
                                {amountText}
                            </Text>
                        </View>
                    </ItemGroup>

                    {/* {!!holdersOp && (
                        <HoldersOpView
                            theme={theme}
                            op={holdersOp}
                            targetKind={targetContract?.kind}
                        />
                    )} */}

                    <ItemGroup style={{ marginBottom: 16 }}>
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                                {t('common.from')}
                            </Text>
                            <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                                <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    {/* {!!from.name && (
                                        <Text
                                            style={[{ color: theme.textPrimary, flexShrink: 1 }, Typography.regular17_24]}
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                        >
                                            {from.name + ' '}
                                        </Text>
                                    )} */}
                                    <Text style={{ color: theme.textPrimary }}>
                                        <SolanaWalletAddress
                                            address={solanaAddress}
                                            elipsise={{ end: 4 }}
                                            disableContextMenu
                                        />
                                    </Text>
                                </Text>
                            </View>
                        </View>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                        <Pressable
                            style={({ pressed }) => ({
                                paddingHorizontal: 10, justifyContent: 'center',
                                opacity: pressed ? 0.5 : 1,
                            })}
                            onPress={() => onCopyAddress(order.target)}
                        >
                            <Text style={{
                                fontSize: 13, lineHeight: 18, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.to')}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    style={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                >
                                    <Text style={{ color: theme.textPrimary }}>
                                        {order.target.replaceAll('-', '\u2011')}
                                    </Text>
                                </Text>
                            </View>
                        </Pressable>
                    </ItemGroup>
                    {order.comment && order.comment.length > 0 && (
                        <ItemGroup style={{ marginBottom: 16 }}>
                            <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                    {t('common.message')}
                                </Text>
                                <View style={{ alignItems: 'flex-start' }}>
                                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                        {order.comment}
                                    </Text>
                                </View>
                            </View>
                        </ItemGroup>
                    )}
                    <View style={{ height: 54 }} />
                </View>
            </ScrollView>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <RoundButton
                    title={t('common.confirm')}
                    action={doSend}
                />
            </View>
        </View>
    );
}

export const SolanaTransferFragment = fragment(() => {
    const params: SolanaTransferParams = useParams();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                style={[{ paddingLeft: 16 }, Platform.select({ android: { paddingTop: safeArea.top } })]}
                onBackPressed={navigation.goBack}
                onClosePressed={() => navigation.navigateAndReplaceAll('Home')}
            />
            <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
                <TransferLoaded {...params} />
            </View>
        </View>
    );
});