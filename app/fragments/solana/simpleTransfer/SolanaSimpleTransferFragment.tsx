import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useTheme } from "../../../engine/hooks";
import { useParams } from "../../../utils/useParams";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useSolanaSimpleTransfer } from "./hooks/useSolanaSimpleTransfer";
import { View, Text, ScrollView, Platform } from "react-native";
import { fragment } from "../../../fragment";
import { useCallback } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { SolanaAddressInputRef } from "../../../components/address/SolanaAddressInput";
import { ATextInputRef } from "../../../components/ATextInput";
import { SelectedInput } from "../../secure/simpleTransfer/hooks/useSimpleTransfer";
import { setStatusBarStyle } from "expo-status-bar";

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

    return (
        <View>
            <Text>Solana Simple Transfer</Text>
        </View>
    );
}

SolanaSimpleTransferComponent.name = 'SolanaSimpleTransfer';

export const SolanaSimpleTransferFragment = fragment(SolanaSimpleTransferComponent);