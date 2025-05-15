import { useCallback, useMemo, useRef, useState } from 'react';
import { ResolvedTxUrl, resolveUrl } from '../../../../utils/resolveUrl';
import { t } from '../../../../i18n/t';
import { KnownWallets } from '../../../../secure/KnownWallets';
import { useLinkNavigator } from "../../../../useLinkNavigator";
import { formatCurrency, formatInputAmount } from '../../../../utils/formatCurrency';
import { useAccountLite, useIsLedgerRoute, useJetton, useNetwork, usePrice, useSelectedAccount, useSolanaSelectedAccount, useVerifyJetton } from '../../../../engine/hooks';
import { fromBnWithDecimals, toBnWithDecimals } from '../../../../utils/withDecimals';
import { fromNano, Cell, Address, toNano } from '@ton/core';
import { useWalletVersion } from '../../../../engine/hooks/useWalletVersion';
import { WalletVersions } from '../../../../engine/types';
import { useGaslessConfig } from '../../../../engine/hooks/jettons/useGaslessConfig';
import { useJettonPayload } from '../../../../engine/hooks/jettons/useJettonPayload';
import { useHoldersAccountTrargets } from '../../../../engine/hooks/holders/useHoldersAccountTrargets';
import { getQueryData } from '../../../../engine/utils/getQueryData';
import { queryClient } from '../../../../engine/clients';
import { Queries } from '../../../../engine/queries';
import { HintsFull } from '../../../../engine/hooks/jettons/useHintsFull';
import { AddressInputState } from '../../../../components/address/AddressDomainInput';
import { useLedgerAddress } from './useLedgerAddress';
import { useEstimation } from './useEstimation';
import { useOrder } from './useOrder';
import { usePrevious } from './usePrevious';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { TypedNavigation } from '../../../../utils/useTypedNavigation';
import { LedgerOrder, Order } from '../../ops/Order';
import { Alert, Keyboard, Platform } from 'react-native';
import { contractFromPublicKey } from '../../../../engine/contractFromPublicKey';
import { useExtraCurrency } from '../../../../engine/hooks/jettons/useExtraCurrency';
import { SimpleTransferParams } from '../SimpleTransferFragment';
import { useLedgerTransport } from '../../../ledger/components/TransportContext';
import { useAddressFormatsHistory } from '../../../../engine/hooks';

export type SimpleTransferAsset = {
    type: 'jetton';
    master?: Address;
    wallet?: Address;
} | {
    type: 'extraCurrency';
    id: number;
} | {
    type: 'address';
    address: Address;
}

type Options = {
    params: SimpleTransferParams;
    route: RouteProp<ParamListBase>;
    navigation: TypedNavigation;
}

export enum SelectedInput {
    ADDRESS = 0,
    AMOUNT = 1,
    COMMENT = 2,
}

export const useSimpleTransfer = ({ params, navigation }: Options) => {
    const network = useNetwork();
    const knownWallets = KnownWallets(network.isTestnet);
    const isLedger = useIsLedgerRoute()
    const acc = useSelectedAccount();
    const solanaAddress = useSolanaSelectedAccount()!;
    const [price, currency] = usePrice();
    const gaslessConfig = useGaslessConfig();
    const gaslessConfigLoading = gaslessConfig?.isFetching || gaslessConfig?.isLoading;
    const hasParamsFilled = !!params?.target && !!params?.amount;
    const [selectedInput, setSelectedInput] = useState<SelectedInput | null>(hasParamsFilled ? null : SelectedInput.ADDRESS);
    const { saveAddressFormat } = useAddressFormatsHistory();

    // Ledger
    const ledgerAddress = useLedgerAddress({ isLedger })
    const address = isLedger ? ledgerAddress! : acc!.address;

    const accountLite = useAccountLite(address);
    const holdersAccounts = useHoldersAccountTrargets(address!, solanaAddress);
    const ledgerTransport = useLedgerTransport();

    const [addressDomainInputState, setAddressDomainInputState] = useState<AddressInputState>(
        {
            input: params?.target || '',
            target: params?.target || '',
            domain: undefined,
            suffix: undefined,
        }
    );

    const { target, domain } = addressDomainInputState;

    const [commentString, setComment] = useState(params?.comment || '');
    const [selectedAsset, setSelectedAsset] = useState<SimpleTransferAsset | null>(params?.asset || null);
    const jetton = useJetton({
        owner: address?.toString({ testOnly: network.isTestnet }),
        master: selectedAsset?.type === 'jetton' ? selectedAsset.master : undefined,
        wallet: selectedAsset?.type === 'jetton' ? selectedAsset.wallet : undefined
    });
    const extraCurrency = useExtraCurrency(
        selectedAsset?.type === 'extraCurrency' ? selectedAsset.id : null,
        address?.toString({ testOnly: network.isTestnet })
    );

    const decimals = extraCurrency?.preview.decimals ?? jetton?.decimals ?? 9;
    const symbol = extraCurrency?.preview.symbol ?? jetton?.symbol ?? 'TON';

    // if we navigate here from the link, we don't send amount with the correct decimals because we cannot get jetton info there
    // that's why we send an amount with unknownDecimals = true and fetch jetton info here
    const [amount, setAmount] = useState(() => {
        if (!params?.amount) {
            return '';
        }

        if (params?.unknownDecimals) {
            return fromBnWithDecimals(
                fromNano(params.amount),
                decimals
            );
        }

        return fromNano(params.amount);
    });
    
    const [stateInit] = useState<Cell | null>(params?.stateInit || null);
    const estimationRef = useRef<bigint | null>(null);

    // custom payload
    const payload = params.payload ?? null
    // jetton transfer params
    const forwardAmount = params.forwardAmount ?? null;
    const feeAmount = params.feeAmount ?? null;

    const hasGaslessTransfer = gaslessConfig?.data?.gas_jettons
        .map((j) => Address.parse(j.master_id))
        .some((j) => jetton?.master && j.equals(jetton.master));

    const { data: jettonPayload, loading: isJettonPayloadLoading } = useJettonPayload(
        address?.toString({ testOnly: network.isTestnet }),
        jetton?.master?.toString({ testOnly: network.isTestnet })
    );

    const targetAddressValid = useMemo(() => {
        if (target.length > 48) {
            return null;
        }
        try {
            return Address.parseFriendly(target);
        } catch {
            return null;
        }
    }, [target]);

    const validAmount = useMemo(() => {
        if (!amount) {
            return null;
        }

        try {
            const valid = amount.replace(',', '.').replaceAll(' ', '');
            // Manage jettons/extra currencies with decimals
            return toBnWithDecimals(valid, decimals);
        } catch {
            return null;
        }
    }, [amount, decimals]);

    const priceText = useMemo(() => {
        if (!price || jetton || !validAmount || extraCurrency) {
            return undefined;
        }

        const isNeg = validAmount < 0n;
        const abs = isNeg ? -validAmount : validAmount;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(2),
            currency,
            isNeg
        );
    }, [jetton, validAmount, price, currency, extraCurrency]);

    const { isSCAM } = useVerifyJetton({
        ticker: jetton?.symbol,
        master: jetton?.master?.toString({ testOnly: network.isTestnet }),
    });

    const balance = useMemo(() => {
        if (jetton) {
            return jetton.balance;
        } else if (extraCurrency) {
            return BigInt(extraCurrency.amount);
        } else {
            return accountLite?.balance || 0n;
        }
    }, [jetton?.balance, extraCurrency?.amount, accountLite?.balance]);

    // Resolve known wallets params
    const known = knownWallets[targetAddressValid?.address.toString({ testOnly: network.isTestnet }) ?? ''];

    // Resolve order
    const order = useOrder({
        validAmount,
        target,
        domain,
        commentString,
        stateInit,
        jetton,
        app: params?.app,
        acc,
        ledgerAddress,
        known,
        jettonPayload,
        estimationRef,
        isLedger,
        address,
        feeAmount,
        forwardAmount,
        payload,
        extraCurrencyId: selectedAsset?.type === 'extraCurrency' ? selectedAsset.id : null
    });

    const estimation = useEstimation({
        ledgerAddress,
        order,
        stateInit,
        accountLite,
        commentString,
        hasGaslessTransfer,
        jettonPayload,
        estimationRef,
        extraCurrencyId: selectedAsset?.type === 'extraCurrency' ? selectedAsset.id : null
    });

    const estimationPrice = useMemo(() => {
        if (!estimation || !price || !validAmount) {
            return undefined;
        }

        const isNeg = estimation < 0n;
        const abs = isNeg ? -estimation : estimation;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(2),
            currency,
            isNeg
        );
    }, [price, currency, estimation]);

    const walletVersion = useWalletVersion();
    const isV5 = walletVersion === WalletVersions.v5R1;
    const supportsGaslessTransfer = hasGaslessTransfer && isV5;

    const linkNavigator = useLinkNavigator(network.isTestnet);

    const onQRCodeReadData = usePrevious({
        commentString,
        validAmount,
    })

    const onQRCodeRead = useCallback((src: string) => {
        if (!onQRCodeReadData.current) {
            return
        }

        const {
            commentString,
            validAmount
        } = onQRCodeReadData.current

        let res = resolveUrl(src, network.isTestnet);
        if (!res) {
            return;
        }
        const isTransferValid = res && (res.type === 'transaction' || res.type === 'jetton-transaction');
        if (isTransferValid) {
            const tx = res as ResolvedTxUrl;
            if (tx.payload) {
                navigation.goBack();
                linkNavigator(tx);
            } else {
                let mComment = commentString;
                let mTarget = null;
                let mAmount = validAmount;
                let mStateInit = stateInit;
                let mJetton = null;

                try {
                    mAmount = toNano(amount);
                } catch {
                    mAmount = null;
                }

                if (tx.address) {
                    const bounceable = tx.isBounceable ?? true;
                    mTarget = tx.address.toString({ testOnly: network.isTestnet, bounceable });
                }

                if (tx.amount) {
                    mAmount = tx.amount;
                }

                if (tx.comment) {
                    mComment = tx.comment;
                }

                if (tx.type === 'transaction' && tx.stateInit) {
                    mStateInit = tx.stateInit;
                } else {
                    mStateInit = null;
                }

                if (tx.type === 'jetton-transaction' && tx.jettonMaster) {
                    mJetton = tx.jettonMaster
                }

                navigation.navigateSimpleTransfer({
                    target: mTarget,
                    comment: mComment,
                    amount: mAmount,
                    stateInit: mStateInit,
                    asset: mJetton ? { type: 'jetton', master: mJetton } : null
                }, { ledger: isLedger, replace: true });
            }
        }
    }, []);

    const onAddAll = useCallback(() => {
        const amount = fromBnWithDecimals(balance, decimals);
        const formatted = formatInputAmount(amount.replace('.', ','), decimals, { skipFormattingDecimals: true });
        setAmount(formatted);
    }, [balance, decimals]);

    const onAssetSelected = useCallback((selected?: SimpleTransferAsset) => {
        if (selected?.type === 'extraCurrency') {
            setSelectedAsset({ type: 'extraCurrency', id: selected.id });
            return;
        }

        if (selected?.type === 'address') {
            setSelectedAsset({ type: 'address', address: selected.address });
            return;
        }

        if (selected && selected.wallet) {
            setSelectedAsset({ type: 'jetton', master: selected.master, wallet: selected.wallet });
            return;
        }

        setSelectedAsset(null);
    }, []);

    const holdersTarget = holdersAccounts?.find((a) => targetAddressValid?.address.equals(a.address));
    const holdersTargetJetton = holdersTarget?.jettonMaster ? Address.parse(holdersTarget.jettonMaster) : null;
    const jettonMaster = jetton?.master;
    const shouldAddMemo = holdersTarget?.memo ? (holdersTarget.memo !== commentString) : false;
    const shouldChangeJetton = holdersTargetJetton
        ? !jettonMaster?.equals(holdersTargetJetton)
        : holdersTarget && !!jetton && holdersTarget.symbol === 'TON';

    const onChangeJetton = useCallback(() => {
        if (holdersTarget?.symbol === 'TON') {
            setSelectedAsset(null);
            return;
        }

        if (!holdersTarget?.jettonMaster) {
            return;
        }

        const queryCache = queryClient.getQueryCache();
        const key = Queries.HintsFull(address?.toString({ testOnly: network.isTestnet }));
        const hintsFull = getQueryData<HintsFull>(queryCache, key);

        if (hintsFull) {
            const index = hintsFull?.addressesIndex?.[holdersTarget?.jettonMaster];
            const hint = hintsFull?.hints?.[index];

            if (!hint) {
                return;
            }

            try {
                const wallet = Address.parse(hint.walletAddress.address)
                setSelectedAsset({ type: 'jetton', master: wallet });
            } catch { }
        }
    }, [holdersTargetJetton, holdersTarget?.symbol, jetton?.wallet]);

    const amountError = useMemo(() => {
        if (shouldChangeJetton) {
            return t('transfer.error.jettonChange', { symbol: holdersTarget?.symbol });
        }

        if (amount.length === 0) {
            return undefined;
        }
        if (validAmount === null) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount < 0n) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount > balance) {
            return t('transfer.error.notEnoughCoins');
        }
        if (validAmount === 0n && !!jetton) {
            return t('transfer.error.zeroCoins');
        }

        return undefined;
    }, [validAmount, balance, amount, shouldChangeJetton, holdersTarget?.symbol]);

    // Resolve memo error string
    const commentError = useMemo(() => {
        const isEmpty = !commentString || commentString.length === 0;
        const isKnownWithMemo = !!known && known.requireMemo;

        if (isEmpty && isKnownWithMemo) {
            return t('transfer.error.memoRequired');
        }

        const validMemo = commentString === holdersTarget?.memo;

        if (shouldAddMemo && (isEmpty || !validMemo)) {
            return t('transfer.error.memoChange', { memo: holdersTarget?.memo });
        }

        return undefined;
    }, [commentString, known, shouldAddMemo, holdersTarget?.memo]);


    const continueDisabled = !order || gaslessConfigLoading || isJettonPayloadLoading || shouldChangeJetton || shouldAddMemo;
    const continueLoading = gaslessConfigLoading || isJettonPayloadLoading;

    const doSendData = usePrevious({
        publicKey: acc?.publicKey,
        balance,
        commentString,
        isLedger,
        jetton,
        ledgerAddress,
        order,
        back: params?.back,
        supportsGaslessTransfer,
        target,
        validAmount,
        walletVersion,
        callback: params?.callback,
        tonTransport: ledgerTransport.tonTransport,
        isReconnectLedger: ledgerTransport.isReconnectLedger,
        onShowLedgerConnectionError: ledgerTransport.onShowLedgerConnectionError,
    });

    const doSend = useCallback(async () => {
        if (!doSendData.current) return;

        const {
            publicKey,
            balance,
            commentString,
            isLedger,
            jetton,
            ledgerAddress,
            order,
            back,
            supportsGaslessTransfer,
            target,
            validAmount,
            walletVersion,
            callback,
            tonTransport,
            isReconnectLedger,
            onShowLedgerConnectionError
        } = doSendData.current;

        if (validAmount === null || validAmount < 0n) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        if (!target || !order) {
            return;
        }

        let address: Address;
        let bounceableFormat: boolean
        try {
            const addressFriendly = Address.parseFriendly(target)
            address = addressFriendly.address;
            bounceableFormat = addressFriendly.isBounceable;
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        // Load contract
        const contract = await contractFromPublicKey(publicKey!, walletVersion, network.isTestnet);

        // Check if transfering to yourself
        if (isLedger && !ledgerAddress) return;

        if (address.equals(isLedger ? ledgerAddress! : contract.address)) {
            const allowSendingToYourself = await new Promise((resolve) => {
                Alert.alert(t('transfer.error.sendingToYourself'), undefined, [
                    { onPress: () => resolve(true), text: t('common.continueAnyway') },
                    { onPress: () => resolve(false), text: t('common.cancel'), isPreferred: true }
                ]);
            });
            if (!allowSendingToYourself) return;
        }

        // Check amount
        if (balance < validAmount || balance === 0n) {
            Alert.alert(t('common.error'), t('transfer.error.notEnoughCoins'));
            return;
        }

        if (validAmount === 0n) {
            if (!!jetton) {
                Alert.alert(t('transfer.error.zeroCoins'));
                return;
            }
            const allowSendingZero = await new Promise((resolve) => {
                Alert.alert(t('transfer.error.zeroCoinsAlert'), undefined, [
                    { onPress: () => resolve(true), text: t('common.continueAnyway') },
                    { onPress: () => resolve(false), text: t('common.cancel'), isPreferred: true }
                ]);
            });
            if (!allowSendingZero) return;
        }

        setSelectedInput(null);
        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') Keyboard.dismiss();
        saveAddressFormat(address, bounceableFormat);

        if (isLedger) {
            navigation.replace('LedgerSignTransfer', { text: null, order: order as LedgerOrder });
            return;
        }

        // Navigate to transaction confirmation
        navigation.navigateTransfer({
            text: commentString,
            order: order as Order,
            callback,
            back: back ? back + 1 : undefined,
            useGasless: supportsGaslessTransfer
        });
    }, []);

    const isTargetLedger = useMemo(() => {
        try {
            if (ledgerTransport.wallets.length > 0 && targetAddressValid?.address) {
                return ledgerTransport.wallets.some(wallet => {
                    return Address.parse(wallet.address).equals(targetAddressValid.address);
                });
            }
            return false
        } catch {
            return false;
        }
    }, [ledgerTransport.wallets, targetAddressValid?.address]);

    return {
        acc,
        amount,
        amountError,
        balance,
        commentError,
        commentString,
        continueDisabled,
        continueLoading,
        domain,
        estimation,
        estimationPrice,
        holdersTarget,
        isLedger,
        isSCAM,
        jetton,
        known,
        knownWallets,
        ledgerAddress,
        onAddAll,
        onAssetSelected,
        onChangeJetton,
        onQRCodeRead,
        params,
        payload,
        priceText,
        setAddressDomainInputState,
        setAmount,
        setComment,
        shouldChangeJetton,
        symbol,
        accountLite,
        stateInit,
        targetAddressValid,
        selectedInput,
        setSelectedInput,
        doSend,
        selectedAsset,
        extraCurrency,
        isTargetLedger,
        decimals
    }
}
