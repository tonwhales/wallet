import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, BackHandler, Keyboard, Alert } from "react-native";
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Cell, Address } from '@ton/core';
import { setStatusBarStyle } from 'expo-status-bar';
import { ScrollView } from 'react-native-gesture-handler';
import { ATextInputRef } from '../../../components/ATextInput';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { fragment } from '../../../fragment';
import { useParams } from '../../../utils/useParams';
import { useNetwork, useTheme } from '../../../engine/hooks';
import { AddressSearchItem } from '../../../components/address/AddressSearch';
import { AddressDomainInputRef } from '../../../components/address/AddressDomainInput';
import { Fees, Footer, Header, Layout, Comment, SimpleTransferAmount, SimpleTransferAddress } from './components';
import { SelectedInput, useSimpleTransfer } from './hooks/useSimpleTransfer';
import { t } from '../../../i18n/t';
import { TransferHeader } from '../../../components/transfer/TransferHeader';

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
        targetAddressValid,
        setSelectedInput,
        selectedInput,
        doSend
    } = useSimpleTransfer({ params, route, navigation });

    useEffect(() => {
        return () => {
            params?.callback?.(false, null);
        };
    }, [params?.callback]);

    const addressRef = useRef<AddressDomainInputRef>(null);
    const amountRef = useRef<ATextInputRef>(null);
    const commentRef = useRef<ATextInputRef>(null);
    const scrollRef = useRef<ScrollView>(null);

    const onInputFocus = useCallback((index: SelectedInput) => setSelectedInput(index), []);
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
            titleComponent?: ReactNode,
        }
    }>(() => {
        if (selectedInput === null) {
            return { selected: null, onNext: null, header: { title: t('transfer.title') } };
        }

        const headerTitle = targetAddressValid ? {
            titleComponent: (
                <TransferHeader
                    theme={theme}
                    address={targetAddressValid.address}
                    isTestnet={network.isTestnet}
                    bounceable={targetAddressValid.isBounceable}
                    knownWallets={knownWallets}
                />
            )
        } : { title: t('transfer.title') };

        switch (selectedInput) {
            case SelectedInput.ADDRESS:
                return { selected: 'address', onNext: targetAddressValid ? resetInput : null, header: { title: t('common.recipient') } };
            case SelectedInput.AMOUNT:
                return { selected: 'amount', onNext: resetInput, header: headerTitle };
            case SelectedInput.COMMENT:
                return { selected: 'comment', onNext: resetInput, header: headerTitle };
            default:
                return { selected: null, onNext: null, header: headerTitle };
        }
    }, [selectedInput, targetAddressValid, theme, network.isTestnet, knownWallets, t]);

    return (
        <Layout
            ref={scrollRef}
            headerComponent={<Header {...header} />}
            footerComponent={<Footer {...{ selected, onNext, continueDisabled, continueLoading, doSend }} />}
            addressComponent={<SimpleTransferAddress ref={addressRef} {...{ ledgerAddress, params, domain, onInputFocus, setAddressDomainInputState, onInputSubmit, onQRCodeRead, isActive: selected === 'address', onSearchItemSelected, knownWallets }} />}
            amountComponent={<SimpleTransferAmount ref={amountRef} {...{ onAssetSelected, jetton, isLedger, isSCAM, symbol, balance, onAddAll, onInputFocus, amount, setAmount, amountError, priceText, shouldChangeJetton, holdersTarget, onChangeJetton }} />}
            commentComponent={<Comment ref={commentRef} {...{ commentString, isActive: selected === 'comment', payload, onInputFocus, setComment, known, commentError }} />}
            feesComponent={estimation ? <Fees {...{ estimation, estimationPrice }} /> : null}
            scrollEnabled={!selectedInput}
            nestedScrollEnabled={!selectedInput}
            selected={selected}
        />
    );
}

SimpleTransferComponent.name = 'SimpleTransfer';

export const SimpleTransferFragment = fragment(SimpleTransferComponent);