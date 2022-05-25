import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StyleProp, Text, TextStyle, View, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, SendMode, StateInit } from 'ton';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { RoundButton } from '../../components/RoundButton';
import { Theme } from '../../Theme';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { loadWalletKeys, WalletKeys } from '../../storage/walletKeys';
import { useRoute } from '@react-navigation/native';
import { useEngine } from '../../engine/Engine';
import { getCurrentAddress } from '../../storage/appState';
import { AppConfig } from '../../AppConfig';
import { fetchConfig } from '../../engine/api/fetchConfig';
import { t } from '../../i18n/t';
import { LocalizedResources } from '../../i18n/schema';
import { KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { ContractMetadata } from '../../engine/metadata/Metadata';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ScrollView } from 'react-native-gesture-handler';
import { ItemGroup } from '../../components/ItemGroup';
import { ItemLarge } from '../../components/ItemLarge';
import { ItemDivider } from '../../components/ItemDivider';
import { CloseButton } from '../../components/CloseButton';
import { useItem } from '../../engine/persistence/PersistedItem';
import { fetchMetadata } from '../../engine/metadata/fetchMetadata';
import { estimateFees } from '../../engine/estimate/estimateFees';
import { createInstallPluginCell } from '../../utils/createInstallPluinCell';
import { sign } from 'ton-crypto';
import { createDeployPluginCell } from '../../utils/createDeployPluginCell';
import { createRemovePluginCell } from '../../utils/createRemovePluginCell';

const labelStyle: StyleProp<TextStyle> = {
    fontWeight: '600',
    marginLeft: 17,
    fontSize: 17
};

export type ATextInputRef = {
    focus: () => void;
}

type ConfirmLoadedProps = {
    target: {
        address: Address,
        isTestOnly: boolean,
        active: boolean,
        balance: BN
    },
    transferCell: Cell,
    // fees: BN,
    amount: BN,
    metadata: ContractMetadata,
    restricted: boolean,
    operation: 'install' | 'remove' | 'deploy_install'
};

const PluginTransferLoaded = React.memo((props: ConfirmLoadedProps) => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const {
        restricted,
        target,
        transferCell,
        // fees,
        amount,
        operation
    } = props;

    // Verified wallets
    const known = KnownWallets[target.address.toFriendly({ testOnly: AppConfig.isTestnet })];

    // Confirmation
    const doSend = React.useCallback(async () => {
        async function confirm(title: LocalizedResources) {
            return await new Promise<boolean>(resolve => {
                Alert.alert(t(title), t('transfer.confirm'), [{
                    text: t('common.yes'),
                    style: 'destructive',
                    onPress: () => {
                        resolve(true)
                    }
                }, {
                    text: t('common.no'),
                    onPress: () => {
                        resolve(false);
                    }
                }])
            });
        }

        // Load contract
        const acc = getCurrentAddress();
        const contract = await contractFromPublicKey(acc.publicKey);


        // Check if same address
        if (operation !== 'deploy_install' && target.address.equals(contract.address)) {
            Alert.alert(t('transfer.error.sendingToYourself'));
            return;
        }

        // Check amount
        if (account.balance.lt(amount)) {
            Alert.alert(t('transfer.error.notEnoughCoins'));
            return;
        }

        // Check if trying to send to testnet
        if (!AppConfig.isTestnet && target.isTestOnly) {
            let cont = await confirm('transfer.error.addressIsForTestnet');
            if (!cont) {
                return;
            }
        }

        // Check if restricted
        if (restricted) {
            let cont = await confirm('transfer.error.addressCantReceive');
            if (!cont) {
                return;
            }
        }

        // Read key
        let walletKeys: WalletKeys;
        try {
            walletKeys = await loadWalletKeys(acc.secretKeyEnc);
        } catch (e) {
            return;

        }

        const transfer = new Cell();

        // Signature
        transfer.bits.writeBuffer(sign(await transferCell.hash(), walletKeys.keyPair.secretKey));
        // Transfer
        transfer.writeCell(transferCell);

        // Create external message
        let extMessage = new ExternalMessage({
            to: contract.address,
            body: new CommonMessageInfo({
                stateInit: account.seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                body: new CellMessage(transfer)
            })
        });
        let msg = new Cell();
        extMessage.writeTo(msg);

        // Sending transaction
        await backoff('transfer', () => engine.client4.sendMessage(msg.toBoc({ idx: false })));

        // Register pending
        engine.products.main.registerPending({
            id: 'pending-' + account.seqno,
            lt: null,
            // fees: fees,
            fees: new BN(0),
            amount: amount.mul(new BN(-1)),
            address: target.address,
            seqno: account.seqno,
            kind: 'out',
            body: { type: 'payload', cell: transferCell },
            status: 'pending',
            time: Math.floor(Date.now() / 1000),
            bounced: false,
            prev: null
        });

        // Reset stack to root
        navigation.popToTop();
    }, []);

    return (
        <>
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                automaticallyAdjustContentInsets={false}
                alwaysBounceVertical={false}
            >
                <View style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', flexDirection: 'column' }}>

                    <View
                        style={{
                            marginBottom: 14,
                            backgroundColor: "white",
                            borderRadius: 14,
                            justifyContent: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 19,
                            height: 95
                        }}
                    >
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 16,
                            color: '#8E979D'
                        }}>
                            {t('common.amount')}
                        </Text>
                        <Text style={{
                            fontWeight: '800',
                            fontSize: 38,
                            color: Theme.accent,
                            marginTop: 4
                        }}>
                            {fromNano(amount)}
                        </Text>
                    </View>
                    <ItemGroup>
                        <ItemLarge
                            title={t('common.walletAddress')}
                            text={target.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                            verified={!!known}
                            secondary={known ? known.name : undefined}
                        />
                        <ItemDivider />
                        <ItemLarge title={t('transfer.purpose')} text={t(`products.plugins.operation.${operation}`)} />
                        {/* <ItemDivider /> */}
                        {/* <ItemLarge title={t('transfer.feeTitle')} text={fromNano(fees) + ' TON'} /> */}
                    </ItemGroup>
                </View>
            </ScrollView>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <RoundButton
                    title={t('common.confirm')}
                    action={doSend}
                />
            </View>
        </>
    );
});

export const PluginTransferFragment = fragment(() => {
    const params: {
        address: Address,
        operation: 'install' | 'remove' | 'deploy_install',
        amount: BN
    } = useRoute().params! as any;

    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const from = React.useMemo(() => getCurrentAddress(), []);
    const target = React.useMemo(() => Address.parseFriendly(params.address.toFriendly({ testOnly: AppConfig.isTestnet })), []);

    // Fetch all required parameters
    const [loadedProps, setLoadedProps] = React.useState<ConfirmLoadedProps | null>(null);
    const netConfig = engine.products.config.useConfig();
    React.useEffect(() => {

        // Await data
        if (!netConfig) {
            return;
        }

        let exited = false;

        backoff('transfer', async () => {

            // Get contract
            const contract = await contractFromPublicKey(from.publicKey);
            if (exited) {
                return;
            }

            let operationTransfer: Cell | undefined;
            if (params.operation === 'install') {
                operationTransfer = createInstallPluginCell(
                    account.seqno,
                    contract.source.walletId,
                    Math.floor(Date.now() / 1e3) + 60,
                    Address.parse('kQCHw3pPx57A7aycAm2NXR0li23RDplM0dtOq8vN2n5ACh1k'),
                    params.amount
                );
            } else if (params.operation === 'deploy_install') {
                operationTransfer = createDeployPluginCell(
                    account.seqno,
                    contract.source.walletId,
                    Math.floor(Date.now() / 1e3) + 60,
                    target.address,
                    params.amount
                );
            } else if (params.operation === 'remove') {
                operationTransfer = createRemovePluginCell(
                    account.seqno,
                    contract.source.walletId,
                    Math.floor(Date.now() / 1e3) + 60,
                    target.address,
                    params.amount
                );
            }

            // Fetch data
            const [
                config,
                [metadata, state]
            ] = await Promise.all([
                backoff('transfer', () => fetchConfig()),
                backoff('transfer', async () => {
                    let block = await backoff('transfer', () => engine.client4.getLastBlock());
                    return Promise.all([
                        backoff('transfer', () => fetchMetadata(engine.client4, block.last.seqno, target.address)),
                        backoff('transfer', () => engine.client4.getAccount(block.last.seqno, target.address))
                    ])
                }),
            ])
            if (exited || !operationTransfer) {
                return;
            }

            // Check if wallet is restricted
            let restricted = false;
            for (let r of config.wallets.restrict_send) {
                if (Address.parse(r).equals(target.address)) {
                    restricted = true;
                    break;
                }
            }

            // Estimate fee
            // let outMsg = operationTransfer;
            // let fees = estimateFees(netConfig!, operationTransfer, outMsg, state!.account.storageStat);

            // Set state
            setLoadedProps({
                target: {
                    isTestOnly: target.isTestOnly,
                    address: target.address,
                    balance: new BN(state.account.balance.coins, 10),
                    active: state.account.state.type === 'active'
                },
                amount: params.amount,
                transferCell: operationTransfer,
                // fees,
                metadata,
                restricted,
                operation: params.operation
            });
        });

        return () => {
            exited = true;
        };
    }, [netConfig]);

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('transfer.confirmTitle')} />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[labelStyle, { textAlign: 'center' }]}>{t('transfer.confirmTitle')}</Text>
                </View>
            )}
            <View style={{ flexGrow: 1, flexBasis: 0, paddingBottom: safeArea.bottom }}>
                {!loadedProps && (<View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}><LoadingIndicator simple={true} /></View>)}
                {!!loadedProps && <PluginTransferLoaded {...loadedProps} />}
            </View>
            {
                Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                )
            }
        </>
    );
});