import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useTheme } from "../../../engine/hooks";
import { useParams } from "../../../utils/useParams";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useSolanaSimpleTransfer } from "./hooks/useSolanaSimpleTransfer";
import { View, Text, ScrollView, Platform, BackHandler, Keyboard } from "react-native";
import { fragment } from "../../../fragment";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { SolanaAddressInputRef } from "../../../components/address/SolanaAddressInput";
import { ATextInputRef } from "../../../components/ATextInput";
import { SelectedInput } from "../../secure/simpleTransfer/hooks/useSimpleTransfer";
import { setStatusBarStyle } from "expo-status-bar";
import { SimpleTransferAddress, SimpleTransferAmount, SimpleTransferComment, SimpleTransferFooter, SimpleTransferHeader, SimpleTransferLayout } from "../../secure/simpleTransfer/components";

export type SolanaSimpleTransferParams = {
    target?: string | null,
    comment?: string | null,
    amount?: bigint | null,
}

const SolanaSimpleTransferComponent = () => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const params: SolanaSimpleTransferParams | undefined = useParams();
    const route = useRoute();
    const {
        amount,
        amountError,
        balance,
        commentString,
        continueDisabled,
        onAddAll,
        onQRCodeRead,
        setAddressDomainInputState,
        setAmount,
        setComment,
        targetAddressValid,
        setSelectedInput,
        selectedInput,
        doSend
    } = useSolanaSimpleTransfer({ params, route, navigation });

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
        if(selectedInput === 0) {
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
                return { selected: null, onNext: null, header: { title: t('transfer.title') } };
        }
    }, [selectedInput, targetAddressValid, theme, network.isTestnet, knownWallets, t]);

    return (
        <SimpleTransferLayout
            ref={scrollRef}
            headerComponent={<SimpleTransferHeader {...header} />}
            footerComponent={<SimpleTransferFooter {...{ selected, onNext, continueDisabled, continueLoading, doSend }} />}
            addressComponent={<SimpleTransferAddress ref={addressRef} {...{ ledgerAddress, params, domain, onInputFocus, setAddressDomainInputState, onInputSubmit, onQRCodeRead, isActive: selected === 'address', onSearchItemSelected, knownWallets }} />}
            amountComponent={<SimpleTransferAmount ref={amountRef} {...{ onAssetSelected, jetton, isLedger, isSCAM, symbol, balance, onAddAll, onInputFocus, amount, setAmount, amountError, priceText, shouldChangeJetton, holdersTarget, onChangeJetton }} />}
            commentComponent={<SimpleTransferComment ref={commentRef} {...{ commentString, isScrolling, isActive: selected === 'comment', payload, onInputFocus, setComment, known, commentError, maxHeight: selected === 'comment' ? 200 : undefined }} />}
            scrollEnabled={!selectedInput}
            nestedScrollEnabled={!selectedInput}
            selected={selected}
            setIsScrolling={setIsScrolling}
        />
    );
}

SolanaSimpleTransferComponent.name = 'SolanaSimpleTransfer';

export const SolanaSimpleTransferFragment = fragment(SolanaSimpleTransferComponent);