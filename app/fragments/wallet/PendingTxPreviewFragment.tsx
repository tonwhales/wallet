import React, { useCallback, useMemo } from "react";
import { Platform, ScrollView, Text } from "react-native";
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
import { PriceComponent } from "../../components/PriceComponent";
import { copyText } from "../../utils/copyText";
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { ScreenHeader } from "../../components/ScreenHeader";
import { ItemGroup } from "../../components/ItemGroup";
import { AboutIconButton } from "../../components/AboutIconButton";
import { useAppState, useBounceableWalletFormat, useDontShowComments, useNetwork, usePrice, useSelectedAccount, useTheme, useVerifyJetton, useWalletsSettings } from "../../engine/hooks";
import { useWalletSettings } from "../../engine/hooks/appstate/useWalletSettings";
import { Address, fromNano } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { formatAmount, formatCurrency } from "../../utils/formatCurrency";
import { PerfText } from "../../components/basic/PerfText";
import { Typography } from "../../components/styles";
import { useAddressBookContext } from "../../engine/AddressBookContext";
import { PerfView } from "../../components/basic/PerfView";
import { PreviewFrom } from "./views/preview/PreviewFrom";
import { PreviewTo } from "./views/preview/PreviewTo";
import { AddressComponent } from "../../components/address/AddressComponent";
import { PendingTransaction } from "../../engine/state/pending";
import { parseBody } from "../../engine/transactions/parseWalletTransaction";
import { resolveOperation } from "../../engine/transactions/resolveOperation";
import { RoundButton } from "../../components/RoundButton";
import { pendingTxToTransferParams } from "../../utils/toTransferParams";
import { HoldersOp, HoldersOpView } from "../../components/transfer/HoldersOpView";
import { ForcedAvatar, ForcedAvatarType } from "../../components/avatar/ForcedAvatar";
import { useContractInfo } from "../../engine/hooks/metadata/useContractInfo";
import { fromBnWithDecimals } from "../../utils/withDecimals";
import { avatarHash } from "../../utils/avatarHash";

export type PendingTxPreviewParams = {
    transaction: PendingTransaction;
    timedOut?: boolean;
    forceAvatar?: ForcedAvatarType;
    isLedgerTarget?: boolean;
}

const PendingTxPreview = () => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const knownWallets = KnownWallets(isTestnet);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount()!;
    const toaster = useToaster();
    const appState = useAppState();
    const addressBook = useAddressBookContext();
    const [price, currency] = usePrice();
    const [dontShowComments] = useDontShowComments();
    const [walletSettings] = useWalletSettings(selected.address);
    const [bounceableFormat] = useBounceableWalletFormat();
    const params = useParams<PendingTxPreviewParams>();

    const tx = params.transaction;
    const repeatTransfer = useMemo(() => pendingTxToTransferParams(tx, isTestnet), [tx, isTestnet]);
    const body = tx.body?.type === 'payload' ? parseBody(tx.body.cell) : null;
    const amount = tx.body?.type === 'token'
        ? tx.body.amount
        : tx.amount > 0n
            ? tx.amount
            : -tx.amount;
    const fees = tx.fees;
    let comment = tx.body?.type === 'comment' ? tx.body.comment : undefined;
    if (body?.type === 'comment') {
        comment = body.comment;
    }
    if (tx.body?.type === 'token' && tx.body.comment) {
        comment = tx.body.comment;
    }

    const opAddress = tx.body?.type === 'token'
        ? tx.body.target.toString({ testOnly: isTestnet })
        : tx.address?.toString({ testOnly: isTestnet });
    const opAddressBounceable = tx.body?.type === 'token'
        ? tx.body.target.toString({ testOnly: isTestnet, bounceable: tx.body.bounceable })
        : tx.address?.toString({ testOnly: isTestnet, bounceable: tx.bounceable });
    const operation = !!opAddress ? resolveOperation({
        account: Address.parse(opAddress),
        amount: amount,
        body: body
    }, isTestnet) : undefined;
    const isOwn = appState.addresses.findIndex((a) => a.address.toString({ testOnly: isTestnet }) === opAddress) >= 0;

    const { verified } = useVerifyJetton({ master: opAddress });
    const targetContract = useContractInfo(opAddress || '');
    const knownWallet = knownWallets[opAddress ?? ''];
    const contact = addressBook.asContact(opAddress)
    const isSpam = addressBook.isDenyAddress(opAddress);
    const [targetWalletSettings] = useWalletSettings(opAddress);
    const avatarColorHash = targetWalletSettings?.color ?? avatarHash(opAddress ?? '', avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];

    let dateStr = `${formatDate(tx.time, 'MMMM dd, yyyy')} • ${formatTime(tx.time)}`;
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    const feesPrise = useMemo(() => {
        if (!price || (typeof fees !== 'bigint' && fees.type !== 'ton')) {
            return undefined;
        }

        const amount = typeof fees === 'bigint' ? fees : fees.value;

        const isNeg = amount < 0n;
        const abs = isNeg ? -amount : amount;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(3),
            currency,
            isNeg
        );
    }, [price, currency, fees]);

    let jetton = tx.body?.type === 'token' ? tx.body.jetton : null;
    let op = t('tx.sending');
    if (tx.status === 'sent') {
        op = t('tx.sent');
    }
    if (params.timedOut) {
        op = t('tx.timeout');
    }

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (knownWallet) {
        known = knownWallet;
    }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }
    if (!!targetWalletSettings?.name) {
        known = { name: targetWalletSettings.name }
    }

    const participants = useMemo(() => {
        const appState = getAppState();
        const index = `${appState.addresses.findIndex((a) => selected.address?.equals(a.address)) + 1}`;

        if (!opAddressBounceable) {
            return {
                from: {
                    address: selected.address?.toString({ testOnly: isTestnet, bounceable: bounceableFormat }) || '',
                    name: walletSettings?.name || `${t('common.wallet')} ${index}`
                }
            }
        }

        return {
            from: {
                address: selected.address?.toString({ testOnly: isTestnet, bounceable: bounceableFormat }) || '',
                name: walletSettings?.name || `${t('common.wallet')} ${index}`
            },
            to: {
                address: opAddressBounceable,
                name: known?.name
            }
        }
    }, [opAddressBounceable, walletSettings, tx, known, bounceableFormat]);

    const onCopyAddress = useCallback((address: string) => {
        copyText(address);
        toaster.show({
            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
            type: 'default',
            duration: ToastDuration.SHORT,
        });
    }, []);

    const stringText = valueText({
        value: amount,
        precision: tx.body?.type === 'token' && jetton ? jetton.decimals ?? 9 : 9,
        decimals: tx.body?.type === 'token' && jetton ? jetton.decimals : undefined,
    });

    const holdersOp = useMemo<null | HoldersOp>(() => {
        if (params.forceAvatar !== 'holders') {
            return null;
        }

        if (!operation?.op) {
            return null;
        }

        if (operation.op.res === 'known.holders.accountTopUp') {
            return {
                type: 'topUp',
                amount: operation.op.options.amount
            };
        } else if (operation.op.res === 'known.holders.accountJettonTopUp') {
            return { type: 'jettonTopUp' };
        } else if (operation.op.res === 'known.holders.accountLimitsChange') {
            const onetime = operation.op.options.onetime === '0' ? null : operation.op.options.onetime;
            const daily = operation.op.options.daily === '0' ? null : operation.op.options.daily;
            const monthly = operation.op.options.monthly === '0' ? null : operation.op.options.monthly;

            return { type: 'limitsChange', onetime, daily, monthly };
        }

        return null;
    }, [operation?.op, params.forceAvatar]);

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
                    {params.forceAvatar ? (
                        <ForcedAvatar
                            type={params.forceAvatar}
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
                            id={opAddress ?? ''}
                            address={opAddress}
                            showSpambadge
                            verified={verified}
                            borderWidth={2.5}
                            borderColor={theme.surfaceOnElevation}
                            backgroundColor={avatarColor ?? theme.elevation}
                            markContact={!!contact}
                            icProps={{
                                isOwn: isOwn,
                                borderWidth: 2,
                                position: 'bottom',
                                size: 28
                            }}
                            theme={theme}
                            knownWallets={knownWallets}
                            isLedger={params.isLedgerTarget}
                        />
                    )}
                    <PerfText
                        style={[
                            {
                                color: theme.textPrimary,
                                paddingTop: (!!contact || verified || isOwn || knownWallet) ? 16 : 8,
                            },
                            Typography.semiBold17_24
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {op}
                    </PerfText>
                    {!!operation?.op ? (
                        <PerfText
                            style={[{ color: theme.textSecondary, marginTop: 2 }, Typography.regular15_20]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {t(operation.op.res, operation.op.options)}
                        </PerfText>
                    ) : (!!participants.to && (
                        <PerfView style={{ flexDirection: 'row', gap: 6, marginTop: 2, paddingHorizontal: 16 }}>
                            <PerfText
                                style={[{ color: theme.textPrimary, flexShrink: 1 }, Typography.regular17_24]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {participants.to.name}
                            </PerfText>
                            <PerfText
                                style={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                <AddressComponent
                                    address={participants.to.address}
                                    bounceable={tx.body?.type === 'token' ? tx.body.bounceable : tx.bounceable}
                                    end={4}
                                    known={!!known}
                                    testOnly={isTestnet}
                                />
                            </PerfText>
                        </PerfView>
                    ))}
                    <>
                        <Text
                            minimumFontScale={0.4}
                            adjustsFontSizeToFit={true}
                            numberOfLines={1}
                            style={[
                                {
                                    color: theme.textPrimary,
                                    marginTop: 12,
                                },
                                Typography.semiBold27_32
                            ]}
                        >
                            {`${stringText[0]}${stringText[1]}${tx.body?.type !== 'token' ? ' TON' : (jetton?.symbol ? ' ' + jetton?.symbol : '')}`}
                        </Text>
                        {tx.body?.type !== 'token' && (
                            <PriceComponent
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0,
                                    alignSelf: 'center',
                                    paddingVertical: 0,
                                    height: 'auto',
                                    paddingLeft: 0
                                }}
                                theme={theme}
                                textStyle={[{ color: theme.textSecondary }, Typography.regular17_24]}
                                amount={amount}
                            />
                        )}
                    </>
                </PerfView>
                {!!holdersOp && (
                    <HoldersOpView
                        op={holdersOp}
                        targetKind={targetContract?.kind}
                    />
                )}
                {!(dontShowComments && isSpam) && !!comment && (
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
                        kind={'out'}
                        theme={theme}
                        isTestnet={isTestnet}
                        bounceableFormat={bounceableFormat}
                    />
                    {!!participants.to && (
                        <>
                            {!!participants.from.address && (
                                <PerfView style={{
                                    height: 1, alignSelf: 'stretch',
                                    backgroundColor: theme.divider,
                                    marginVertical: 16,
                                    marginHorizontal: 10
                                }} />
                            )}
                            <PreviewTo
                                onCopyAddress={onCopyAddress}
                                to={participants.to}
                                kind={'out'}
                                theme={theme}
                                testOnly={isTestnet}
                                bounceableFormat={bounceableFormat}
                            />
                        </>
                    )}
                </ItemGroup>
                <PerfView style={{
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 20, borderRadius: 20,
                    flexDirection: 'row',
                    justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <PerfView>
                        <PerfText
                            style={[{ color: theme.textSecondary, marginBottom: 2 }, Typography.regular13_18]}>
                            {t('txPreview.blockchainFee')}
                        </PerfText>
                        <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                            {!!fees
                                ? <>
                                    {
                                        (typeof fees !== 'bigint' && fees.type === 'gasless' && !!jetton?.decimals)
                                            ? `${fromBnWithDecimals(fees.value, jetton.decimals)} ${jetton.symbol}`
                                            : `${formatAmount(fromNano(typeof fees !== 'bigint' ? fees.value : fees))}`
                                    }
                                    {feesPrise && (
                                        <PerfText style={{ color: theme.textSecondary }}>
                                            {` ${feesPrise}`}
                                        </PerfText>
                                    )}
                                </>
                                : '...'
                            }
                        </PerfText>
                    </PerfView>
                    <AboutIconButton
                        title={t('txPreview.blockchainFee')}
                        description={t('txPreview.blockchainFeeDescription')}
                        style={{ height: 24, width: 24, position: undefined, marginRight: 8 }}
                        size={24}
                    />
                </PerfView>
            </ScrollView>
            {params.timedOut && !!repeatTransfer && (
                <PerfView style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, paddingHorizontal: 16 }}>
                    <RoundButton
                        title={t('txPreview.sendAgain')}
                        style={{ flexGrow: 1 }}
                        onPress={() => {
                            if (repeatTransfer.type === 'simple') {
                                navigation.navigateSimpleTransfer(repeatTransfer);
                            } else if (repeatTransfer.type === 'transfer') {
                                navigation.navigateTransfer(repeatTransfer);
                            }
                        }}
                    />
                </PerfView>
            )}
        </PerfView>
    );
}
PendingTxPreview.displayName = 'PendingTxPreview';

export const PendingTxPreviewFragment = fragment(PendingTxPreview);
PendingTxPreviewFragment.displayName = 'PendingTxPreviewFragment';