import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, BackHandler, Keyboard } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { Cell } from '@ton/core';
import { setStatusBarStyle } from 'expo-status-bar';
import { ScrollView } from 'react-native-gesture-handler';
import { ATextInputRef } from '../../../components/ATextInput';
import { fragment } from '../../../fragment';
import { useParams } from '../../../utils/useParams';
import { useCurrentAddress, useNetwork, useTheme } from '../../../engine/hooks';
import { AddressSearchItem, SolanaAddressSearchItem } from '../../../components/address/AddressSearch';
import { AddressDomainInputRef, AddressInputState } from '../../../components/address/AddressDomainInput';
import { SimpleTransferLayout, SimpleTransferAmount, SimpleTransferAddress, SimpleTransferComment, SimpleTransferFees, SimpleTransferHeader, SimpleTransferFooter } from './components';
import { SelectedInput, SimpleTransferAsset, useSimpleTransfer } from './hooks/useSimpleTransfer';
import { t } from '../../../i18n/t';
import { TransferHeader } from '../../../components/transfer/TransferHeader';
import { SolanaTransferHeader } from '../../../components/transfer/SolanaTransferHeader';
import { useSolanaSimpleTransfer } from '../../solana/simpleTransfer/hooks/useSolanaSimpleTransfer';
import { isSolanaAddress } from '../../../utils/solana/address';
import { isTonAddress } from '../../../utils/ton/address';
import MindboxSdk from 'mindbox-sdk';
import { MaestraEvent } from '../../../analytics/maestra';

export type TonTransferParams = {
    blockchain?: 'ton';
    target?: string | null,
    comment?: string | null,
    amount?: bigint | null,
    payload?: Cell | null,
    feeAmount?: bigint | null,
    forwardAmount?: bigint | null,
    stateInit?: Cell | null,
    asset?: SimpleTransferAsset | null,
    validUntil?: number,
    domain?: string,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    app?: {
        domain: string,
        title: string,
        url: string,
    },
    extraCurrencyId?: number,
    unknownDecimals?: boolean
}

export type SolanaSimpleTransferParams = {
    blockchain?: 'solana';
    target?: string | null,
    comment?: string | null,
    amount?: string | null,
    token?: string | null
    callback?: (ok: boolean, signature: string | null) => void
}

export type SimpleTransferParams = TonTransferParams | SolanaSimpleTransferParams

const SimpleTransferComponent = () => {
    const { isLedger, tonAddress } = useCurrentAddress()
    const theme = useTheme();
    const params = useParams<SimpleTransferParams>();
    const network = useNetwork();

    const [addressType, setAddressType] = useState<'ton' | 'solana' | null>(() => {
        if (!params?.target) return null;
        if (!isLedger && isSolanaAddress(params.target)) return 'solana';
        if (isTonAddress(params.target)) return 'ton';
        return null;
    });

    const tonParams: TonTransferParams = addressType === 'ton' || params?.blockchain === 'ton'
        ? params as TonTransferParams
        : { blockchain: 'ton' };

    const solanaParams: SolanaSimpleTransferParams = addressType === 'solana' || params?.blockchain === 'solana'
        ? params as SolanaSimpleTransferParams
        : { blockchain: 'solana' };

    const tonTransfer = useSimpleTransfer({
        params: tonParams
    });

    const solanaTransfer = useSolanaSimpleTransfer({
        params: solanaParams,
    });

    const activeTransfer = addressType === 'solana' ? solanaTransfer : tonTransfer;

    const {
        amount,
        amountError,
        balance,
        commentString,
        continueDisabled,
        setAmount,
        setComment,
        symbol,
        decimals,
        onAddAll,
        doSend,
        selectedInput,
        setSelectedInput,
        selectedAsset
    } = activeTransfer;

    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        return () => {
            params?.callback?.(false, null);
        };
    }, [params?.callback]);

    const addressRef = useRef<AddressDomainInputRef>(null);
    const amountRef = useRef<ATextInputRef>(null);
    const commentRef = useRef<ATextInputRef>(null);
    const scrollRef = useRef<ScrollView>(null);

    const onInputFocus = useCallback((index: SelectedInput) => setSelectedInput(index), [setSelectedInput]);
    const onInputSubmit = useCallback(() => setSelectedInput(null), [setSelectedInput]);

    const handleAddressStateChange = useCallback((state: AddressInputState) => {
        if (state.addressType === 'solana' && !isLedger) {
            setAddressType('solana');
            solanaTransfer.setAddressInputState({
                input: state.input || state.target,
                target: state.target,
                suffix: state.suffix
            });
        } else {
            setAddressType('ton');
            tonTransfer.setAddressDomainInputState(state);
        }

    }, [tonTransfer, solanaTransfer, isLedger]);

    const hasValidAddress = (addressType === 'ton' && tonTransfer.targetAddressValid) ||
        (addressType === 'solana' && solanaTransfer.targetAddressValid?.[0]);

    useFocusEffect(() => {
        setStatusBarStyle(Platform.select({
            android: theme.style === 'dark' ? 'light' : 'dark',
            ios: 'light',
            default: 'auto'
        }));
    });

    const onSearchItemSelected = useCallback((item: AddressSearchItem | SolanaAddressSearchItem) => {
        scrollRef.current?.scrollTo({ y: 0 });
        if (item.memo) {
            setComment(item.memo);
        }
    }, [setComment]);

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

    const resetInput = () => {
        Keyboard.dismiss();
        setSelectedInput(null);
    };

    useEffect(() => {
        if (selectedInput === 0) {
            scrollRef.current?.scrollTo({ y: 0, animated: true })
        }
    }, [selectedInput])

    const { selected, onNext, header } = useMemo<{
        selected: 'amount' | 'address' | 'comment' | null,
        onNext: (() => void) | null,
        header: {
            onBackPressed?: () => void,
            title?: string,
            titleComponent?: ReactNode,
        }
    }>(() => {
        let headerTitle: { title?: string, titleComponent?: ReactNode };

        if (addressType === 'ton' && tonTransfer.targetAddressValid) {
            headerTitle = {
                titleComponent: (
                    <TransferHeader
                        theme={theme}
                        address={tonTransfer.targetAddressValid.address}
                        isTestnet={network.isTestnet}
                        bounceable={tonTransfer.targetAddressValid.isBounceable}
                        knownWallets={tonTransfer.knownWallets}
                        isLedger={tonTransfer.isTargetLedger}
                    />
                )
            };
        } else if (addressType === 'solana' && solanaTransfer.targetAddressValid?.[0]) {
            headerTitle = {
                titleComponent: (
                    <SolanaTransferHeader address={solanaTransfer.targetAddressValid[0]} />
                )
            };
        } else {
            headerTitle = { title: t('transfer.title') };
        }

        switch (selectedInput) {
            case SelectedInput.ADDRESS:
                return { selected: 'address', onNext: hasValidAddress ? resetInput : null, header: { title: t('common.recipient') } };
            case SelectedInput.AMOUNT:
                return { selected: 'amount', onNext: resetInput, header: headerTitle };
            case SelectedInput.COMMENT:
                return { selected: 'comment', onNext: resetInput, header: headerTitle };
            default:
                return { selected: null, onNext: null, header: { title: t('transfer.title') } };
        }
    }, [selectedInput, addressType, tonTransfer, solanaTransfer, theme, network.isTestnet, hasValidAddress]);

    const addressComponent = useMemo(() => {
        return (
            <SimpleTransferAddress
                ref={addressRef}
                ledgerAddress={tonTransfer.ledgerAddress}
                params={params}
                domain={tonTransfer.domain}
                onInputFocus={onInputFocus}
                setAddressDomainInputState={handleAddressStateChange}
                onInputSubmit={onInputSubmit}
                onQRCodeRead={tonTransfer.onQRCodeRead}
                isActive={selected === 'address'}
                onSearchItemSelected={onSearchItemSelected}
                knownWallets={tonTransfer.knownWallets || {}}
                initialBlockchain={params?.blockchain}
            />
        );
    }, [selected, params, tonTransfer, onInputFocus, onInputSubmit, onSearchItemSelected, handleAddressStateChange]);

    const commentComponent = useMemo(() => {
        return (
            hasValidAddress ? (
                addressType === 'ton' ? (
                    <SimpleTransferComment
                        ref={commentRef}
                        commentString={commentString}
                        isScrolling={isScrolling}
                        isActive={selected === 'comment'}
                        payload={tonTransfer.payload}
                        onInputFocus={onInputFocus}
                        setComment={setComment}
                        known={tonTransfer.known}
                        commentError={tonTransfer.commentError}
                        maxHeight={selected === 'comment' ? 200 : undefined}
                    />
                ) : (
                    <SimpleTransferComment
                        ref={commentRef}
                        commentString={commentString}
                        isScrolling={isScrolling}
                        isActive={selected === 'comment'}
                        onInputFocus={onInputFocus}
                        setComment={setComment}
                        maxHeight={selected === 'comment' ? 200 : undefined}
                    />
                )
            ) : null
        );
    }, [commentString, selected, addressType, tonTransfer, solanaTransfer.logoURI, symbol]);

    const amountComponent = useMemo(() => {
        return (
            hasValidAddress ? (
                addressType === 'ton' ? (
                    <SimpleTransferAmount
                        ref={amountRef}
                        onAssetSelected={tonTransfer.onAssetSelected}
                        jetton={tonTransfer.jetton}
                        isLedger={tonTransfer.isLedger}
                        isSCAM={tonTransfer.isSCAM}
                        symbol={symbol}
                        balance={balance}
                        onAddAll={onAddAll}
                        onInputFocus={onInputFocus}
                        amount={amount}
                        setAmount={setAmount}
                        amountError={amountError}
                        priceText={tonTransfer.priceText}
                        shouldChangeJetton={tonTransfer.shouldChangeJetton}
                        holdersTargetSymbol={tonTransfer.holdersTargetSymbol}
                        onChangeJetton={tonTransfer.onChangeJetton}
                        selectedAsset={selectedAsset}
                        extraCurrency={tonTransfer.extraCurrency}
                        decimals={decimals}
                    />
                ) : (
                    <SimpleTransferAmount
                        ref={amountRef}
                        symbol={symbol}
                        decimals={decimals}
                        balance={balance}
                        onAddAll={onAddAll}
                        onInputFocus={onInputFocus}
                        amount={amount}
                        setAmount={setAmount}
                        amountError={amountError}
                        logoURI={solanaTransfer.logoURI}
                        isSolana={true}
                        shouldChangeJetton={solanaTransfer.shouldChangeToken}
                        holdersTargetSymbol={solanaTransfer.holdersTargetSymbol}
                        onChangeJetton={solanaTransfer.onChangeToken}
                        onAssetSelected={solanaTransfer.onAssetSelected}
                        selectedAsset={selectedAsset}
                    />
                )
            ) : null
        );
    }, [amount, amountError, balance, decimals, onAddAll, onInputFocus, solanaTransfer.logoURI, symbol, addressType, tonTransfer, solanaTransfer]);

    useEffect(() => {
        if (tonAddress) {
            const tonhubID = tonAddress.toString({ testOnly: network.isTestnet });
            MindboxSdk.executeAsyncOperation({
                operationSystemName: MaestraEvent.ViewSendPage,
                operationBody: {
                    customer: {
                        ids: {
                            tonhubID
                        }
                    }
                },
            });
        }
    }, [tonAddress, network.isTestnet]);

    return (
        <SimpleTransferLayout
            ref={scrollRef}
            headerComponent={<SimpleTransferHeader {...header} />}
            footerComponent={<SimpleTransferFooter {...{ selected, onNext, continueDisabled, continueLoading: addressType === 'ton' ? tonTransfer.continueLoading : undefined, doSend }} />}
            addressComponent={addressComponent}
            amountComponent={amountComponent}
            commentComponent={commentComponent}
            feesComponent={addressType === 'ton' && hasValidAddress && tonTransfer.estimation ? <SimpleTransferFees estimation={tonTransfer.estimation} estimationPrice={tonTransfer.estimationPrice} /> : null}
            scrollEnabled={!selectedInput}
            nestedScrollEnabled={!selectedInput}
            selected={selected}
            setIsScrolling={setIsScrolling}
        />
    );
}

SimpleTransferComponent.name = 'SimpleTransfer';

export const SimpleTransferFragment = fragment(SimpleTransferComponent);