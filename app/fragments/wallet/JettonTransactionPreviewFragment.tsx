import React, { useCallback, useMemo } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getAppState } from "../../storage/appState";
import { useParams } from "../../utils/useParams";
import { valueText } from "../../components/ValueComponent";
import { formatDate, formatTime } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Avatar, avatarColors } from "../../components/avatar/Avatar";
import { t } from "../../i18n/t";
import { KnownWallet, KnownWallets } from "../../secure/KnownWallets";
import { RoundButton } from "../../components/RoundButton";
import { copyText } from "../../utils/copyText";
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { ScreenHeader } from "../../components/ScreenHeader";
import { ItemGroup } from "../../components/ItemGroup";
import { useAppState, useBounceableWalletFormat, useDontShowComments, useJetton, useKnownJettons, useNetwork, usePrice, useSelectedAccount, useServerConfig, useSpamMinAmount, useTheme, useVerifyJetton, useWalletsSettings } from "../../engine/hooks";
import { useRoute } from "@react-navigation/native";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address, toNano } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { PerfText } from "../../components/basic/PerfText";
import { Typography } from "../../components/styles";
import { useAddressBookContext } from "../../engine/AddressBookContext";
import { PerfView } from "../../components/basic/PerfView";
import { PreviewFrom } from "./views/preview/PreviewFrom";
import { PreviewTo } from "./views/preview/PreviewTo";
import { AddressComponent } from "../../components/address/AddressComponent";
import { avatarHash } from "../../utils/avatarHash";
import { useContractInfo } from "../../engine/hooks/metadata/useContractInfo";
import { ForcedAvatar, ForcedAvatarType } from "../../components/avatar/ForcedAvatar";
import { isJettonTxSPAM, parseForwardPayloadComment } from "../../utils/spam/isTxSPAM";
import { JettonTransfer } from "../../engine/hooks/transactions/useJettonTransactions";
import { mapJettonToMasterState } from "../../utils/jettons/mapJettonToMasterState";
import { fromBnWithDecimals } from "../../utils/withDecimals";
import { TxInfo } from "./views/preview/TxInfo";

export type JettonTransactionPreviewParams = {
    transaction: JettonTransfer;
    owner: string;
    master: string;
    wallet: string;
}

const JettonTransactionPreview = () => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const knownWallets = KnownWallets(isTestnet);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount()!;
    const toaster = useToaster();
    const appState = useAppState();
    const addressBook = useAddressBookContext();
    const [spamMinAmount] = useSpamMinAmount();
    const [dontShowComments] = useDontShowComments();
    const [bounceableFormat] = useBounceableWalletFormat();
    const [walletsSettings] = useWalletsSettings();

    const { transaction: tx, owner, master, wallet } = useParams<JettonTransactionPreviewParams>();

    // TODO: Implement LedgerTransactionPreview
    // const ledgerContext = useLedgerTransport();
    // const route = useRoute();
    // const isLedger = route.name === 'LedgerTransactionPreview';

    const address = selected.address;
    const destination = tx.destination
    const source = tx.source;
    const amount = BigInt(tx.amount);
    const destinationAddress = Address.parse(destination);
    const sourceAddress = Address.parse(source);
    const kind: 'in' | 'out' = destinationAddress.equals(address) ? 'in' : 'out';
    const displayAddress = kind === 'in' ? sourceAddress : destinationAddress;
    const isOwn = appState.addresses.findIndex((a) => a.address.equals(displayAddress)) >= 0;
    const displayAddressBounceable = displayAddress.toString({ testOnly: isTestnet });
    const comment = parseForwardPayloadComment(tx.forward_payload);

    const ownWalletSettings = walletsSettings[displayAddressBounceable];
    const opAddressWalletSettings = walletsSettings[displayAddressBounceable];

    const avatarColorHash = opAddressWalletSettings?.color ?? avatarHash(displayAddressBounceable, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    const contact = addressBook.asContact(displayAddressBounceable);

    let dateStr = `${formatDate(tx.transaction_now, 'MMMM dd, yyyy')} • ${formatTime(tx.transaction_now)}`;
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    const jetton = useJetton({ owner, wallet, master });
    const jettonMasterContent = jetton ? mapJettonToMasterState(jetton, isTestnet) : null;
    const targetContract = useContractInfo(destinationAddress.toString({ testOnly: isTestnet }));

    let op = kind === 'in' ? t('tx.received') : t('tx.sent');
    const status = tx.transaction_aborted ? 'failed' : 'success';

    if (kind === 'out' && targetContract?.kind === 'jetton-card') {
        op = t('known.holders.accountJettonTopUp');
    }

    if (status === 'failed') {
        op = t('tx.failed');
    }

    const forceAvatar: ForcedAvatarType | undefined = useMemo(() => {
        if (targetContract?.kind === 'dedust-vault') {
            return 'dedust';
        } else if (targetContract?.kind === 'card' || targetContract?.kind === 'jetton-card') {
            return 'holders';
        }
    }, [targetContract]);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (knownWallets[displayAddressBounceable]) {
        known = knownWallets[displayAddressBounceable];
    }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }
    if (!!opAddressWalletSettings?.name) { // Resolve target wallet settings
        known = { name: opAddressWalletSettings.name }
    }

    const config = useServerConfig().data;
    const spam = isJettonTxSPAM(
        tx,
        {
            knownWallets,
            isDenyAddress: addressBook.isDenyAddress,
            spamWallets: config?.wallets?.spam ?? [],
            spamMinAmount,
            isTestnet,
            own: address,
        }
    );

    const participants = useMemo(() => {
        const appState = getAppState();
        const index = `${appState.addresses.findIndex((a) => address?.equals(a.address)) + 1}`;
        const onwnAdress = address.toString({ testOnly: isTestnet, bounceable: bounceableFormat });
        const ownName = ownWalletSettings?.name || `${t('common.wallet')} ${index}`;
        const displayAddressString = displayAddress.toString({ testOnly: isTestnet, bounceable: bounceableFormat });

        if (kind === 'out') {
            return {
                from: {
                    address: onwnAdress,
                    name: ownName
                },
                to: {
                    address: displayAddressString,
                    name: known?.name
                }
            }
        }

        return {
            from: {
                address: displayAddressString,
                name: known?.name
            },
            to: {
                address: onwnAdress,
                name: ownName
            }
        }
    }, [displayAddress, ownWalletSettings, tx, known, bounceableFormat]);

    const onCopyAddress = useCallback((address: string) => {
        copyText(address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, []);

    const decimals = jettonMasterContent?.decimals ?? 9;
    const amountText = valueText({
        value: BigInt(tx.amount),
        precision: 9,
        decimals
    });

    const amountColor = kind === 'in'
        ? spam
            ? theme.textPrimary
            : theme.accentGreen
        : theme.textPrimary

    const { isSCAM: isSCAMJetton } = useVerifyJetton({
        ticker: jettonMasterContent?.symbol,
        master: master
    });

    const symbolString = jettonMasterContent?.symbol ? ` ${jettonMasterContent.symbol}` : ''
    const singleAmountString = `${amountText[0]}${amountText[1]}${symbolString}`;

    const buffTxHash = Buffer.from(tx.trace_id, 'base64');
    const txHash = buffTxHash.toString('base64');

    return (
        <PerfView
            style={{
                alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
                alignItems: 'center',
                paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
            }}
        >
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                onClosePressed={navigation.goBack}
                title={dateStr}
                titleStyle={Typography.regular15_20}
            />
            <ScrollView
                style={{ flexGrow: 1, alignSelf: 'stretch', marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
                contentInset={{ bottom: safeArea.bottom + 16 }}
                alwaysBounceVertical={false}
            >
                <PerfView style={{
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 20,
                    padding: 20,
                    width: '100%',
                    overflow: 'hidden',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <PerfView style={{ backgroundColor: theme.divider, position: 'absolute', top: 0, left: 0, right: 0, height: 54 }} />
                    {!!forceAvatar ? (
                        <ForcedAvatar
                            type={forceAvatar}
                            size={68}
                            icProps={{
                                borderWidth: 2,
                                position: 'bottom',
                                size: 28
                            }}
                        />
                    ) : (
                        <Avatar
                            size={68}
                            id={displayAddressBounceable}
                            address={displayAddressBounceable}
                            spam={spam}
                            showSpambadge
                            borderWith={2.5}
                            borderColor={theme.surfaceOnElevation}
                            backgroundColor={avatarColor}
                            markContact={!!contact}
                            icProps={{
                                isOwn,
                                borderWidth: 2,
                                position: 'bottom',
                                size: 28
                            }}
                            theme={theme}
                            knownWallets={knownWallets}
                            hash={opAddressWalletSettings?.avatar}
                        />
                    )}
                    <PerfText
                        style={[
                            {
                                color: theme.textPrimary,
                                paddingTop: (spam || !!contact || isOwn || !!knownWallets[displayAddressBounceable]) ? 16 : 8,
                            },
                            Typography.semiBold17_24
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {op}
                    </PerfText>
                    {!!known?.name && (
                        <PerfView style={{ flexDirection: 'row', gap: 6, marginTop: 2, paddingHorizontal: 16 }}>
                            <PerfText
                                style={[{ color: theme.textPrimary, flexShrink: 1 }, Typography.regular17_24]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {known.name}
                            </PerfText>
                            <PerfText
                                style={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                <AddressComponent
                                    address={displayAddress}
                                    end={4}
                                    testOnly={isTestnet}
                                    known={!!known}
                                />
                            </PerfText>
                        </PerfView>
                    )}
                    {status === 'failed' ? (
                        <PerfText style={[
                            { color: theme.accentRed, marginTop: 12 },
                            Typography.semiBold27_32
                        ]}>
                            {t('tx.failed')}
                        </PerfText>
                    ) : (
                        <>
                            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    minimumFontScale={0.4}
                                    adjustsFontSizeToFit={true}
                                    numberOfLines={1}
                                    style={[{ color: amountColor }, Typography.semiBold27_32]}
                                >
                                    {singleAmountString}
                                    {isSCAMJetton && (' • ')}
                                </Text>
                                {isSCAMJetton && (
                                    <Text style={[{ color: theme.accentRed }, Typography.semiBold27_32]}>
                                        {'SCAM'}
                                    </Text>
                                )}
                            </View>
                        </>
                    )}
                </PerfView>
                {!(dontShowComments && spam) && (!!comment) && (
                    <ItemGroup style={{ marginTop: 16 }}>
                        <PerfView style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <PerfText style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                                {t('common.message')}
                            </PerfText>
                            <PerfView style={{ alignItems: 'flex-start' }}>
                                <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                    {comment}
                                </PerfText>
                            </PerfView>
                        </PerfView>
                    </ItemGroup>
                )}
                <ItemGroup style={{ marginVertical: 16 }}>
                    <PreviewFrom
                        onCopyAddress={onCopyAddress}
                        from={participants.from}
                        kind={kind}
                        theme={theme}
                        isTestnet={isTestnet}
                        bounceableFormat={bounceableFormat}
                    />
                    {(!!participants.to.address && !!participants.from.address) && (
                        <PerfView style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                    )}
                    <PreviewTo
                        onCopyAddress={onCopyAddress}
                        to={participants.to}
                        kind={kind}
                        theme={theme}
                        testOnly={isTestnet}
                        bounceableFormat={bounceableFormat}
                    />
                    <PerfView style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                    <TxInfo
                        lt={tx.transaction_lt}
                        address={address?.toString({ testOnly: isTestnet }) || ''}
                        hash={txHash}
                        toaster={toaster}
                        theme={theme}
                        isTestnet={isTestnet}
                    />
                </ItemGroup>
            </ScrollView>
            {kind === 'out' && (
                <PerfView style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, paddingHorizontal: 16 }}>
                    <RoundButton
                        title={t('txPreview.sendAgain')}
                        style={{ flexGrow: 1 }}
                        onPress={() => {
                            const txAmount = toNano(fromBnWithDecimals(amount, decimals));
                            const isNeg = amount < 0n;
                            navigation.navigateSimpleTransfer({
                                target: destinationAddress.toString({ testOnly: isTestnet, bounceable: bounceableFormat }),
                                comment: comment,
                                amount: isNeg ? -txAmount : txAmount,
                                stateInit: null,
                                jetton: Address.parse(wallet),
                                callback: null
                            });
                        }}
                    />
                </PerfView>
            )}
        </PerfView>
    );
}
JettonTransactionPreview.displayName = 'JettonTransactionPreview';

export const JettonTransactionPreviewFragment = fragment(JettonTransactionPreview);
JettonTransactionPreviewFragment.displayName = 'JettonTransactionPreviewFragment';