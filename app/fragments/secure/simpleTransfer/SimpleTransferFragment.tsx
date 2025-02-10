import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, BackHandler, Keyboard, Alert } from "react-native";
import { ATextInputRef } from '../../../components/ATextInput';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { fragment } from '../../../fragment';
import { useParams } from '../../../utils/useParams';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useNetwork, useSelectedAccount, useTheme } from '../../../engine/hooks';
import { Cell, Address } from '@ton/core';
import { setStatusBarStyle } from 'expo-status-bar';
import { ScrollView } from 'react-native-gesture-handler';
import { AddressSearchItem } from '../../../components/address/AddressSearch';
import { AddressDomainInputRef } from '../../../components/address/AddressDomainInput';
import { Fees, Footer, Header, Layout, Comment, SimpleTransferAmount, SimpleTransferAddress } from './components';
import { useSimpleTransfer } from './hooks/useSimpleTransfer';
import { t } from '../../../i18n/t';
import { TransferHeader } from '../../../components/transfer/TransferHeader';
import { LedgerOrder, Order } from '../ops/Order';
import { contractFromPublicKey } from '../../../engine/contractFromPublicKey';
import { useWalletVersion } from '../../../engine/hooks/useWalletVersion';
import { usePrevious } from './hooks/usePrevious';

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

const SimpleTransferComponent = () => {
    const theme = useTheme();

    const navigation = useTypedNavigation();
    const params: SimpleTransferParams | undefined = useParams();
    const route = useRoute();
    const network = useNetwork();
    const acc = useSelectedAccount();
    const walletVersion = useWalletVersion();

    const {
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
        payload,
        priceText,
        setAddressDomainInputState,
        setAmount,
        setComment,
        shouldChangeJetton,
        symbol,
        target,
        order,
        supportsGaslessTransfer,
        targetAddressValid,
        validAmount,
    } = useSimpleTransfer({params, route, navigation})

    const callback: ((ok: boolean, result: Cell | null) => void) | null = useMemo(() => params && params.callback ? params.callback : null, [params.callback])

    // Auto-cancel job
    useEffect(() => {
        return () => {
            if (params && params.callback) {
                params.callback(false, null);
            }
        }
    }, []);

    const addressRef = useRef<AddressDomainInputRef>(null);
    const amountRef = useRef<ATextInputRef>(null);
    const commentRef = useRef<ATextInputRef>(null);
    const scrollRef = useRef<ScrollView>(null);

    const onInputFocus = useCallback((index: number) => { setSelectedInput(index) }, []);
    const onInputSubmit = useCallback(() => setSelectedInput(null), []);

    useFocusEffect(() => {
        setStatusBarStyle(Platform.select({
            android: theme.style === 'dark' ? 'light' : 'dark',
            ios: 'light',
            default: 'auto'
        }));
    });

    const onSearchItemSelected = useCallback((item: AddressSearchItem) => {
        scrollRef.current?.scrollTo({ y: 0 });
        if (item.memo) {
            setComment(item.memo);
        }
    }, []);

    const hasParamsFilled = !!params.target && !!params.amount;
    const [selectedInput, setSelectedInput] = useState<number | null>(hasParamsFilled ? null : 0);

    const backHandler = useCallback(() => {
        if (selectedInput !== null) {
            setSelectedInput(null);
            return true;
        }
        return false;
    }, [selectedInput]);

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', backHandler);
        return () => BackHandler.removeEventListener('hardwareBackPress', backHandler);
    }, [backHandler]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ y: 0 });
    }, [selectedInput]);

    const doSendData = usePrevious({
        publicKey: acc?.publicKey,
        balance,
        commentString,
        isLedger,
        jetton,
        ledgerAddress,
        order,
        back: params.back,
        supportsGaslessTransfer,
        target,
        validAmount,
        walletVersion,
    })

    const doSend = useCallback(async () => {
        if (!doSendData.current) {
            return
        }

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
            walletVersion
        } = doSendData.current

        let address: Address;

        try {
            let parsed = Address.parseFriendly(target);
            address = parsed.address;
        } catch (e) {
            Alert.alert(t('transfer.error.invalidAddress'));
            return;
        }

        if (validAmount === null) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        if (validAmount < 0n) {
            Alert.alert(t('transfer.error.invalidAmount'));
            return;
        }

        // Might not happen
        if (!order) {
            return;
        }

        // Load contract
        const contract = await contractFromPublicKey(publicKey!, walletVersion, network.isTestnet);

        // Check if transfering to yourself
        if (isLedger && !ledgerAddress) {
            return;
        }

        if (address.equals(isLedger ? ledgerAddress! : contract.address)) {
            let allowSendingToYourself = await new Promise((resolve) => {
                Alert.alert(t('transfer.error.sendingToYourself'), undefined, [
                    {
                        onPress: () => resolve(true),
                        text: t('common.continueAnyway')
                    },
                    {
                        onPress: () => resolve(false),
                        text: t('common.cancel'),
                        isPreferred: true,
                    }
                ]);
            });
            if (!allowSendingToYourself) {
                return;
            }
        }

        // Check amount
        if (balance < validAmount || balance === 0n) {
            Alert.alert(
                t('common.error'),
                t('transfer.error.notEnoughCoins')
            );
            return;
        }

        if (validAmount === 0n) {
            if (!!jetton) {
                Alert.alert(t('transfer.error.zeroCoins'));
                return;
            }
            let allowSeingZero = await new Promise((resolve) => {
                Alert.alert(t('transfer.error.zeroCoinsAlert'), undefined, [
                    {
                        onPress: () => resolve(true),
                        text: t('common.continueAnyway')
                    },
                    {
                        onPress: () => resolve(false),
                        text: t('common.cancel'),
                        isPreferred: true,
                    }
                ]);
            });
            if (!allowSeingZero) {
                return;
            }
        }

        setSelectedInput(null);
        // Dismiss keyboard for iOS
        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        }

        if (isLedger) {
            navigation.replace('LedgerSignTransfer', {
                text: null,
                order: order as LedgerOrder,
            });
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

    const resetInput = () => {
        Keyboard.dismiss();
        setSelectedInput(null);
    };


    const { selected, onNext, header } = useMemo<{
        selected: 'amount' | 'address' | 'comment' | null,
        onNext: (() => void) | null,
        header: {
            onBackPressed?: () => void,
            title?: string,
            rightButton?: ReactNode,
            titleComponent?: ReactNode,
        }
    }>(() => {

        if (selectedInput === null) {
            return {
                selected: null,
                onNext: null,
                header: { title: t('transfer.title') }
            }
        }

        let headertitle: {
            onBackPressed?: () => void,
            title?: string,
            rightButton?: ReactNode,
            titleComponent?: ReactNode,
        } = { title: t('transfer.title') };

        if (targetAddressValid) {
            headertitle = {
                titleComponent: (
                    <TransferHeader
                        theme={theme}
                        address={targetAddressValid.address}
                        isTestnet={network.isTestnet}
                        bounceable={targetAddressValid.isBounceable}
                        knownWallets={knownWallets}
                    />
                )
            };
        }

        if (selectedInput === 0) {
            return {
                selected: 'address',
                onNext: targetAddressValid ? resetInput : null,
                header: {
                    title: t('common.recipient'),
                    titleComponent: undefined,
                }
            }
        }

        if (selectedInput === 1) {
            return {
                selected: 'amount',
                onNext: resetInput,
                header: { ...headertitle }
            }
        }

        if (selectedInput === 2) {
            return {
                selected: 'comment',
                onNext: resetInput,
                header: { ...headertitle }
            }
        }

        // Default
        return { selected: null, onNext: null, header: { ...headertitle } };
    }, [selectedInput, targetAddressValid, doSend]);

    return (
        <Layout
            ref={scrollRef}
            headerComponent={<Header {...header} />}
            footerComponent={<Footer {...{ selected, onNext, continueDisabled, continueLoading, doSend }} />}
            addressComponent={<SimpleTransferAddress ref={addressRef} {...{ ledgerAddress, params, domain, onInputFocus, setAddressDomainInputState, onInputSubmit, onQRCodeRead, selected, onSearchItemSelected, knownWallets, selectedInput }} />}
            amountComponent={<SimpleTransferAmount ref={amountRef} {...{ onAssetSelected, jetton, isLedger, isSCAM, symbol, balance, onAddAll, onInputFocus, amount, setAmount, amountError, priceText, shouldChangeJetton, holdersTarget, onChangeJetton }} />}
            commentComponent={<Comment ref={commentRef} {...{ commentString, selected, payload, onInputFocus, setComment, known, commentError }} />}
            feesComponent={estimation ? <Fees {...{ estimation, estimationPrice }} /> : null}
            scrollEnabled={!selectedInput}
            nestedScrollEnabled={!selectedInput}
            selected={selected}
        />
    );
}

SimpleTransferComponent.name = 'SimpleTransfer';

export const SimpleTransferFragment = fragment(SimpleTransferComponent);