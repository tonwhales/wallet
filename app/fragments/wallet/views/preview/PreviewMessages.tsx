import { Address, CommonMessageInfoRelaxedInternal, MessageRelaxed, fromNano, toNano } from "@ton/core";
import { memo, useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import { ItemGroup } from "../../../../components/ItemGroup";
import { ThemeType } from "../../../../engine/state/theme";
import { fetchMetadata } from "../../../../engine/metadata/fetchMetadata";
import { TonClient4 } from "@ton/ton";
import { useClient4, useNetwork, useServerConfig } from "../../../../engine/hooks";
import { backoff } from "../../../../utils/time";
import { parseBody } from "../../../../engine/transactions/parseWalletTransaction";
import { SupportedMessage, parseMessageBody } from "../../../../engine/transactions/parseMessageBody";
import { JettonMasterState } from "../../../../engine/metadata/fetchJettonMasterContent";
import { getJettonMaster } from "../../../../engine/getters/getJettonMaster";
import { resolveOperation } from "../../../../engine/transactions/resolveOperation";
import { KnownWallet, KnownWallets } from "../../../../secure/KnownWallets";
import { AddressBook, AddressContact } from "../../../../engine/hooks/contacts/useAddressBook";
import { ServerConfig } from "../../../../engine/api/fetchConfig";
import { ItemCollapsible } from "../../../../components/ItemCollapsible";
import { t } from "../../../../i18n/t";
import { AddressComponent } from "../../../../components/address/AddressComponent";
import { PriceComponent } from "../../../../components/PriceComponent";
import { StoredOperation } from "../../../../engine/types/transactions";
import { fetchContractInfo } from "../../../../engine/api/fetchContractInfo";

import IcAlert from '@assets/ic-alert.svg';

type PreparedMessage = {
    target: {
        address: Address,
        bounceable: boolean,
        active: boolean,
    },
    operation: StoredOperation,
    parsedBody: SupportedMessage | null,
    known: KnownWallet | undefined,
    spam: boolean,
    jettonAmount: bigint | null,
    contact: null,
    jettonMaster: JettonMasterState | null,
    gas: { amount: bigint | null, unusual: boolean },
    amount: bigint,
}

const MessagePreview = memo(({
    index,
    message,
    theme,
    client,
    isTestnet,
    contacts,
    denyList,
    serverConfig
}: {
    index: number
    message: MessageRelaxed,
    theme: ThemeType,
    client: TonClient4,
    isTestnet: boolean,
    contacts: { [key: string]: AddressContact },
    denyList: { [key: string]: { reason: string | null } },
    serverConfig?: ServerConfig
}) => {
    const [prepared, setPrepared] = useState<'loading' | PreparedMessage>('loading');

    useEffect(() => {
        (async () => {
            if (message.info.type === 'internal') {
                const to = message.info.dest;
                const block = await backoff('transfer', () => client.getLastBlock());
                const [metadata, state] = await Promise.all([
                    backoff('transfer', () => fetchMetadata(client, block.last.seqno, to, isTestnet, true)),
                    backoff('transfer', () => client.getAccount(block.last.seqno, to)),
                ]);

                let body = message.body ? parseBody(message.body) : null;
                let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell) : null;
                let amount = message.info.value.coins ?? 0n;

                // Read jetton master
                let jettonMaster: JettonMasterState | null = null;
                if (metadata.jettonWallet) {
                    jettonMaster = getJettonMaster(metadata.jettonWallet!.master, isTestnet) || null;
                }

                let jettonAmount: bigint | null = null;
                try {
                    if (jettonMaster && message.body) {
                        const temp = message.body;
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

                if (jettonAmount && jettonMaster && metadata.jettonWallet) {
                    gas.amount = amount;

                    if (amount > toNano('0.2')) {
                        gas.unusual = true;
                    }
                }

                // Resolve operation
                let operation = resolveOperation({
                    body: body,
                    amount: amount,
                    account: to,
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

                const info = await fetchContractInfo(friendlyTarget);

                if (!amount && operation.items[0].kind === 'ton') {
                    amount = BigInt(operation.items[0].amount);
                }
                
                if (!jettonAmount && operation.items[0].kind === 'token') {
                    jettonAmount = BigInt(operation.items[0].amount);
                }

                setPrepared({
                    target: {
                        address: target,
                        active: state.account.state.type === 'active',
                        bounceable: info?.kind !== 'wallet'
                    },
                    amount,
                    gas,
                    operation,
                    parsedBody,
                    known,
                    spam,
                    jettonAmount,
                    contact: null,
                    jettonMaster
                });
            }
        })();
    }, [message]);

    return (
        <ItemCollapsible
            key={`internal-${index}`}
            style={{ marginTop: 16 }}
            titleStyle={{
                fontSize: 15, lineHeight: 20, fontWeight: '400',
                color: theme.textSecondary,
            }}
            title={t('common.transaction') + ` #${index + 1}`}
        >
            {prepared === 'loading' ? (
                <View>

                </View>
            ) : (
                <>
                    {(prepared.jettonAmount || prepared.amount) && (
                        <>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('common.amount')}
                                </Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                        {prepared.jettonAmount
                                            ? fromNano(prepared.jettonAmount) + (prepared.jettonMaster?.symbol ?? '')
                                            : fromNano(prepared.amount) + ' TON'
                                        }
                                    </Text>
                                    {!prepared.jettonAmount && (
                                        <PriceComponent
                                            amount={prepared.amount}
                                            style={{
                                                backgroundColor: theme.transparent,
                                                paddingHorizontal: 0,
                                                alignSelf: 'flex-end'
                                            }}
                                            textStyle={{
                                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                color: theme.textSecondary,
                                                flexShrink: 1
                                            }}
                                            theme={theme}
                                        />
                                    )}
                                </View>
                            </View>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                        </>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{
                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                            color: theme.textSecondary,
                        }}>
                            {t('common.to')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                <AddressComponent
                                    bounceable={prepared.target.bounceable}
                                    address={prepared.target.address}
                                    start={10}
                                    end={4}
                                />
                            </Text>
                            {prepared.known && (
                                <View style={{ flexDirection: 'row' }}>
                                    <Text
                                        style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: theme.textSecondary,
                                            flexShrink: 1
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                    >
                                        {prepared.known?.name}
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
                            {(!prepared.target.active) && (
                                <View style={{ flexDirection: 'row' }}>
                                    <Text
                                        style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: theme.textSecondary,
                                            flexShrink: 1
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                    >
                                        {t('transfer.addressNotActive')}
                                    </Text>
                                    <IcAlert style={{ height: 18, width: 18, marginLeft: 6 }} height={18} width={18} />
                                </View>
                            )}
                            {prepared.spam && (
                                <View style={{ flexDirection: 'row' }}>
                                    <Text
                                        style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: theme.textSecondary,
                                            flexShrink: 1
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                    >
                                        {'SPAM'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    {!!prepared.jettonAmount && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('transfer.gasFee')}
                                </Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                        {fromNano(prepared.amount) + ' TON'}
                                    </Text>
                                    <PriceComponent
                                        amount={prepared.amount}
                                        style={{
                                            backgroundColor: theme.transparent,
                                            paddingHorizontal: 0,
                                            alignSelf: 'flex-end'
                                        }}
                                        textStyle={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: theme.textSecondary,
                                            flexShrink: 1
                                        }}
                                        theme={theme}
                                    />
                                </View>
                            </View>
                        </>
                    )}
                    {!!prepared.operation.op && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('transfer.purpose')}
                                </Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                        {t(prepared.operation.op.res, prepared.operation.op.options)}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                    {!!prepared.operation.comment && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('transfer.commentLabel')}
                                </Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                        {prepared.operation.comment}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
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
    outMessages: MessageRelaxed[],
    theme: ThemeType,
    addressBook: AddressBook
}) => {
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const contacts = addressBook.contacts;
    const denyList = addressBook.denyList;
    const serverConfig = useServerConfig().data;

    return (
        <View>
            {outMessages.map((message, index) => (
                <MessagePreview
                    key={`internal-${index}`}
                    index={index}
                    message={message}
                    theme={theme}
                    client={client}
                    isTestnet={isTestnet}
                    contacts={contacts}
                    denyList={denyList}
                    serverConfig={serverConfig}
                />
            ))}
        </View>
    );
});