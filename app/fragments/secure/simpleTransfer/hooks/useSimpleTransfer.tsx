import { useCallback, useMemo, useRef, useState } from 'react';
import { ResolvedTxUrl, resolveUrl } from '../../../../utils/resolveUrl';
import { t } from '../../../../i18n/t';
import { KnownWallets } from '../../../../secure/KnownWallets';
import { useLinkNavigator } from "../../../../useLinkNavigator";
import { formatCurrency, formatInputAmount } from '../../../../utils/formatCurrency';
import { useAccountLite, useJetton, useNetwork, usePrice, useSelectedAccount, useVerifyJetton } from '../../../../engine/hooks';
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

export type SimpleTransferParams = {
    target?: string | null,
    comment?: string | null,
    amount?: bigint | null,
    payload?: Cell | null,
    feeAmount?: bigint | null,
    forwardAmount?: bigint | null,
    stateInit?: Cell | null,
    jetton?: Address | null,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    app?: {
        domain: string,
        title: string,
        url: string,
    }
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

export const useSimpleTransfer = ({ params, route, navigation }: Options) => {
    const network = useNetwork();
    const knownWallets = KnownWallets(network.isTestnet);
    const isLedger = route.name === 'LedgerSimpleTransfer';
    const acc = useSelectedAccount();
    const [price, currency] = usePrice();
    const gaslessConfig = useGaslessConfig();
    const gaslessConfigLoading = gaslessConfig?.isFetching || gaslessConfig?.isLoading;
    const hasParamsFilled = !!params?.target && !!params?.amount;
    const [selectedInput, setSelectedInput] = useState<SelectedInput | null>(hasParamsFilled ? null : SelectedInput.ADDRESS);

    // Ledger
    const ledgerAddress = useLedgerAddress({ isLedger })
    const address = isLedger ? ledgerAddress! : acc!.address;

    const accountLite = useAccountLite(address);
    const holdersAccounts = useHoldersAccountTrargets(address!);

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
    const [amount, setAmount] = useState(params?.amount ? fromNano(params.amount) : '');
    const [stateInit] = useState<Cell | null>(params?.stateInit || null);
    const [selectedJetton, setJetton] = useState<Address | null>(params?.jetton || null);
    const estimationRef = useRef<bigint | null>(null);

    // custom payload
    const payload = params.payload ?? null
    // jetton transfer params
    const forwardAmount = params.forwardAmount ?? null;
    const feeAmount = params.feeAmount ?? null;

    const jetton = useJetton({
        owner: address?.toString({ testOnly: network.isTestnet }),
        wallet: selectedJetton?.toString({ testOnly: network.isTestnet })
    });

    const hasGaslessTransfer = gaslessConfig?.data?.gas_jettons
        .map((j) => Address.parse(j.master_id))
        .some((j) => jetton?.master && j.equals(jetton.master));

    const symbol = jetton ? jetton.symbol : 'TON';

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
        let value: bigint | null = null;

        if (!amount) {
            return null;
        }

        try {
            const valid = amount.replace(',', '.').replaceAll(' ', '');
            // Manage jettons with decimals
            if (jetton) {
                value = toBnWithDecimals(valid, jetton?.decimals ?? 9);
            } else {
                value = toNano(valid);
            }
            return value;
        } catch {
            return null;
        }
    }, [amount, jetton]);

    const priceText = useMemo(() => {
        if (!price || jetton || !validAmount) {
            return undefined;
        }

        const isNeg = validAmount < 0n;
        const abs = isNeg ? -validAmount : validAmount;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(2),
            currency,
            isNeg
        );
    }, [jetton, validAmount, price, currency]);

    const { isSCAM } = useVerifyJetton({
        ticker: jetton?.symbol,
        master: jetton?.master?.toString({ testOnly: network.isTestnet }),
    });

    const balance = useMemo(() => {
        let value: bigint;
        if (jetton) {
            value = jetton.balance;
        } else {
            value = accountLite?.balance || 0n;
        }
        return value;
    }, [jetton, accountLite?.balance, isLedger]);

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
    })

    const estimation = useEstimation({
        ledgerAddress,
        order,
        stateInit,
        accountLite,
        commentString,
        hasGaslessTransfer,
        jettonPayload,
        estimationRef,
    })

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
                    const bounceable = tx.isBounceable === false ? false : true;
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
                    jetton: mJetton
                }, { ledger: isLedger, replace: true });
            }
        }
    }, []);

    const onAddAll = useCallback(() => {
        const amount = jetton
            ? fromBnWithDecimals(balance, jetton?.decimals)
            : fromNano(balance);
        const formatted = formatInputAmount(amount.replace('.', ','), jetton?.decimals ?? 9, { skipFormattingDecimals: true });
        setAmount(formatted);
    }, [balance, jetton]);

    const onAssetSelected = useCallback((selected?: { master: Address, wallet?: Address }) => {
        if (selected && selected.wallet) {
            setJetton(selected.wallet);
            return;
        }
        setJetton(null);
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
            setJetton(null);
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
                setJetton(wallet);
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
        callback: params?.callback
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
            callback
        } = doSendData.current;

        if (validAmount === null || validAmount < 0n) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        if (!target || !order) {
            return;
        }

        let address: Address;
        try {
            address = Address.parseFriendly(target).address;
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
        doSend
    }
}
