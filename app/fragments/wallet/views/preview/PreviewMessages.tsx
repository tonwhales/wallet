import { Address, Cell, fromNano, toNano } from "@ton/core";
import { memo, useMemo } from "react";
import { View, Text, Image, Platform } from "react-native";
import { ThemeType } from "../../../../engine/state/theme";
import { useContractMetadata, useNetwork, useServerConfig } from "../../../../engine/hooks";
import { parseBody } from "../../../../engine/transactions/parseWalletTransaction";
import { JettonMasterState } from "../../../../engine/metadata/fetchJettonMasterContent";
import { getJettonMaster } from "../../../../engine/getters/getJettonMaster";
import { resolveOperation } from "../../../../engine/transactions/resolveOperation";
import { KnownWallet, KnownWallets } from "../../../../secure/KnownWallets";
import { AddressBook, AddressContact } from "../../../../engine/hooks/contacts/useAddressBook";
import { ServerConfig } from "../../../../engine/api/fetchConfig";
import { ItemCollapsible } from "../../../../components/ItemCollapsible";
import { t } from "../../../../i18n/t";
import { PriceComponent } from "../../../../components/PriceComponent";
import { StoredMessage } from "../../../../engine/types/transactions";
import { Typography } from "../../../../components/styles";
import { useContractInfo } from "../../../../engine/hooks/metadata/useContractInfo";
import { WalletAddress } from "../../../../components/address/WalletAddress";

const MessagePreview = memo(({
    index,
    message,
    theme,
    isTestnet,
    contacts,
    denyList,
    serverConfig
}: {
    index: number
    message: StoredMessage,
    theme: ThemeType,
    isTestnet: boolean,
    contacts: { [key: string]: AddressContact },
    denyList: { [key: string]: { reason: string | null } },
    serverConfig?: ServerConfig
}) => {
    const addressString = message.info.type === 'internal' ? message.info.dest : null;
    const metadata = useContractMetadata(addressString);
    const contractInfo = useContractInfo(addressString);
    const bounceable = contractInfo?.kind !== 'wallet';

    const address = useMemo(() => {
        if (!addressString) {
            return null;
        }
        try {
            return Address.parse(addressString);
        } catch (error) {
            return null;
        }
    }, [addressString]);

    if (!address || !addressString || message.info.type !== 'internal') {
        return null;
    }

    // check for empty body
    const bodyCell = Cell.fromBoc(Buffer.from(message.body, 'base64'))[0];
    const body = parseBody(bodyCell);
    let amount = BigInt(message.info.value || '0');

    // Read jetton master
    let jettonMaster: JettonMasterState | null = null;
    if (!!metadata?.jettonWallet) {
        jettonMaster = getJettonMaster(Address.parse(metadata.jettonWallet.master), isTestnet) || null;
    }

    let jettonAmount: bigint | null = null;
    try {
        if (jettonMaster && message.body) {
            const temp = bodyCell;
            if (temp) {
                const parsing = temp.beginParse();
                parsing.loadUint(32);
                parsing.loadUint(64);
                jettonAmount = parsing.loadCoins();
            }
        }
    } catch {
        console.warn('Failed to parse jetton amount');
    }

    let gas: { amount: bigint | null, unusual: boolean } = {
        amount: null,
        unusual: false
    };

    if (jettonAmount && !!jettonMaster && !!metadata?.jettonWallet) {
        gas.amount = amount;

        if (amount > toNano('0.2')) {
            gas.unusual = true;
        }
    }

    // Resolve operation
    let operation = resolveOperation({
        body: body,
        amount: amount,
        account: address,
    }, isTestnet);

    const friendlyTarget = operation.address;
    const target = Address.parse(friendlyTarget);
    const contact = contacts[operation.address];

    let known: KnownWallet | undefined = undefined;

    if (KnownWallets(isTestnet)[friendlyTarget]) {
        known = KnownWallets(isTestnet)[friendlyTarget];
    }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }
    const isSpam = !!(denyList ?? {})[operation.address];
    const spam = !!serverConfig?.wallets.spam.find((s) => s === friendlyTarget) || isSpam;

    if (!amount && operation.items[0].kind === 'ton') {
        amount = BigInt(operation.items[0].amount);
    }

    if (!jettonAmount && operation.items[0].kind === 'token') {
        jettonAmount = BigInt(operation.items[0].amount);
    }

    return (
        <ItemCollapsible
            key={`internal-${index}`}
            titleStyle={[{ color: theme.textPrimary }, Typography.regular17_24]}
            title={t('common.message') + ` #${index + 1}`}
        >
            {(jettonAmount || amount) && (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('common.amount')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.medium17_24]}>
                                {jettonAmount
                                    ? fromNano(jettonAmount) + (` ${jettonMaster?.symbol}` ?? '')
                                    : fromNano(amount) + ' TON'
                                }
                            </Text>
                            {!jettonAmount && (
                                <PriceComponent
                                    amount={amount}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'flex-end'
                                    }}
                                    textStyle={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                                    theme={theme}
                                />
                            )}
                        </View>
                    </View>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                </>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                    {t('common.to')}
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                    <WalletAddress
                        address={target}
                        elipsise={{ start: 10, end: 4 }}
                        style={{
                            flexShrink: 1,
                            alignSelf: 'center',
                        }}
                        textStyle={[{ color: theme.textPrimary }, Typography.medium17_24]}
                        disableContextMenu
                        copyOnPress
                        copyToastProps={Platform.select({
                            android: { marginBottom: 16, }
                        })}
                        bounceable={bounceable}
                    />
                    {known && (
                        <View style={{ flexDirection: 'row' }}>
                            <Text
                                style={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                            >
                                {known?.name}
                            </Text>
                            <View style={{
                                justifyContent: 'center', alignItems: 'center',
                                height: 18, width: 18, borderRadius: 9,
                                marginLeft: 6,
                                backgroundColor: theme.surfaceOnBg
                            }}>
                                <Image
                                    source={require('@assets/ic-verified.png')}
                                    style={{ height: 18, width: 18 }}
                                />
                            </View>
                        </View>
                    )}
                    {spam && (
                        <View style={{ flexDirection: 'row' }}>
                            <Text
                                style={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                                numberOfLines={1}
                                ellipsizeMode={'tail'}
                            >
                                {'SPAM'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            {!!jettonAmount && (
                <>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('transfer.gasFee')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.medium17_24]}>
                                {fromNano(amount) + ' TON'}
                            </Text>
                            <PriceComponent
                                amount={amount}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                                theme={theme}
                            />
                        </View>
                    </View>
                </>
            )}
            {!!operation.op && (
                <>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('transfer.purpose')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.medium17_24]}>
                                {t(operation.op.res, operation.op.options)}
                            </Text>
                        </View>
                    </View>
                </>
            )}
            {!!operation.comment && (
                <>
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {t('transfer.commentLabel')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.medium17_24]}>
                                {operation.comment}
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </ItemCollapsible>
    );
});

export const PreviewMessages = memo(({
    outMessages,
    theme,
    addressBook
}: {
    outMessages: StoredMessage[],
    theme: ThemeType,
    addressBook: AddressBook,
}) => {
    const { isTestnet } = useNetwork();
    const contacts = addressBook.contacts;
    const denyList = addressBook.denyList;
    const serverConfig = useServerConfig().data;

    return (
        <View style={{ gap: 16 }}>
            {outMessages.map((message, index) => (
                <MessagePreview
                    key={`internal-${index}`}
                    index={index}
                    message={message}
                    theme={theme}
                    isTestnet={isTestnet}
                    contacts={contacts}
                    denyList={denyList}
                    serverConfig={serverConfig}
                />
            ))}
        </View>
    );
});