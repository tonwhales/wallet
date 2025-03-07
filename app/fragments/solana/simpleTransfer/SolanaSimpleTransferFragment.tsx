import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../engine/hooks";
import { useParams } from "../../../utils/useParams";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useSolanaSimpleTransfer } from "./hooks/useSolanaSimpleTransfer";
import { ScrollView, Platform, BackHandler, Keyboard } from "react-native";
import { fragment } from "../../../fragment";
import React, { useState, useRef, useCallback, useEffect, useMemo, ReactNode } from "react";
import { SolanaAddressInputRef } from "../../../components/address/SolanaAddressInput";
import { ATextInputRef } from "../../../components/ATextInput";
import { SelectedInput } from "../../secure/simpleTransfer/hooks/useSimpleTransfer";
import { setStatusBarStyle } from "expo-status-bar";
import { SimpleTransferAmount, SimpleTransferComment, SimpleTransferFooter, SimpleTransferHeader, SimpleTransferLayout } from "../../secure/simpleTransfer/components";
import { SolanaTransferHeader } from "../../../components/transfer/SolanaTransferHeader";
import { SolanaSimpleTransferAddress } from "./components/SolanaSimpleTransferAddress";
import { t } from "../../../i18n/t";
import { useSolanaSelectedAccount } from "../../../engine/hooks/solana/useSolanaSelectedAccount";

export type SolanaSimpleTransferParams = {
    target?: string | null,
    comment?: string | null,
    amount?: bigint | null,
}

const SolanaSimpleTransferComponent = () => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const params: SolanaSimpleTransferParams | undefined = useParams();
    const owner = useSolanaSelectedAccount()!;
    const {
        amount,
        amountError,
        balance,
        commentString,
        continueDisabled,
        onAddAll,
        onQRCodeRead,
        setAddressInputState,
        setAmount,
        setComment,
        targetAddressValid,
        setSelectedInput,
        selectedInput,
        doSend
    } = useSolanaSimpleTransfer({ params, navigation, owner });

    const [isScrolling, setIsScrolling] = useState(false);

    const addressRef = useRef<SolanaAddressInputRef>(null);
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
    }, [selectedInput]);

    const { selected, onNext, header } = useMemo<{
        selected: 'amount' | 'address' | 'comment' | null,
        onNext: (() => void) | null,
        header: {
            onBackPressed?: () => void,
            title?: string,
            titleComponent?: ReactNode,
        }
    }>(() => {
        const headerTitle = targetAddressValid[0] ? {
            titleComponent: (
                <SolanaTransferHeader address={targetAddressValid[0]} />
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
                return { selected: null, onNext: null, header: { title: t('transfer.title') } };
        }
    }, [selectedInput, targetAddressValid, theme]);

    const commentMaxHeight = selected === 'comment' ? 200 : undefined;

    console.log({ continueDisabled });

    return (
        <SimpleTransferLayout
            ref={scrollRef}
            headerComponent={<SimpleTransferHeader {...header} />}
            footerComponent={<SimpleTransferFooter {...{ selected, onNext, continueDisabled, doSend }} />}
            addressComponent={<SolanaSimpleTransferAddress ref={addressRef} {...{ initTarget: params?.target, setAddressInputState, onInputSubmit, onInputFocus, onQRCodeRead, isActive: selected === 'address' }} />}
            amountComponent={<SimpleTransferAmount ref={amountRef} {...{ symbol: 'SOL', balance, onAddAll, onInputFocus, amount, setAmount, amountError }} />}
            commentComponent={<SimpleTransferComment ref={commentRef} {...{ commentString, isScrolling, isActive: selected === 'comment', onInputFocus, setComment, maxHeight: commentMaxHeight }} />}
            scrollEnabled={!selectedInput}
            nestedScrollEnabled={!selectedInput}
            selected={selected}
            setIsScrolling={setIsScrolling}
        />
    );
}

SolanaSimpleTransferComponent.name = 'SolanaSimpleTransfer';

export const SolanaSimpleTransferFragment = fragment(SolanaSimpleTransferComponent);