import { forwardRef, memo, ReactNode, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Platform, View, StyleProp, ViewStyle, StyleSheet } from "react-native";
import { useKeyboard } from '@react-native-community/hooks';
import { ScrollView } from 'react-native-gesture-handler';
import { AnimatedWrapper } from './SimpleTransferAnimatedWrapper';
import { LayoutChangeEvent } from 'react-native';

type Props = {
    headerComponent: ReactNode;
    footerComponent: ReactNode;
    addressComponent: ReactNode;
    amountComponent: ReactNode;
    commentComponent: ReactNode;
    feesComponent: ReactNode;
    scrollEnabled: boolean;
    nestedScrollEnabled: boolean;
    selected: "address" | "amount" | "comment" | null
}

export const Layout = memo(forwardRef(({
    headerComponent,
    footerComponent,
    scrollEnabled,
    nestedScrollEnabled,
    addressComponent,
    amountComponent,
    commentComponent,
    feesComponent,
    selected
}: Props, ref) => {
    const keyboard = useKeyboard();

    const innerRef = useRef<ScrollView>(null)
    useImperativeHandle(ref, () => innerRef.current)

    const [addressInputHeight, setAddressInputHeight] = useState(0);
    const [amountInputHeight, setAmountInputHeight] = useState(0);

    const _setAddressInputHeight = useCallback((e: LayoutChangeEvent) => {
        setAddressInputHeight(e.nativeEvent.layout.height)
    }, [])
    const _setAmountInputHeight = useCallback((e: LayoutChangeEvent) => {
        setAmountInputHeight(e.nativeEvent.layout.height)
    }, [])

    const seletectInputStyles = useMemo<{
        amount: StyleProp<ViewStyle>,
        address: StyleProp<ViewStyle>,
        comment: StyleProp<ViewStyle>,
        fees: StyleProp<ViewStyle>,
    }>(() => {
        switch (selected) {
            case 'address':
                return {
                    address: styles.addressAddress,
                    amount: [styles.disabled, styles.disabledHeight],
                    comment: [styles.disabled, styles.disabledHeight],
                    fees: [styles.disabled, styles.disabledHeight],
                }
            case 'amount':
                return {
                    address: styles.disabled,
                    amount: [styles.amountAmount, {top: -addressInputHeight - 16}],
                    comment: styles.disabled,
                    fees: styles.disabled,
                }
            case 'comment':
                return {
                    address: styles.disabled,
                    amount: styles.disabled,
                    comment: [styles.commentComment, {top: -addressInputHeight - amountInputHeight - 32}],
                    fees: styles.disabled,
                }
            default:
                return {
                    address: styles.default,
                    amount: styles.default,
                    comment: styles.default,
                    fees: styles.default,
                }
        }
    }, [selected, addressInputHeight, amountInputHeight]);

    return (
        <View style={{ flexGrow: 1 }}>
            {headerComponent}
            <ScrollView
                ref={innerRef}
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', marginTop: 16 }}
                contentContainerStyle={[{ marginHorizontal: 16, flexGrow: 1 }, Platform.select({ android: { minHeight: addressInputHeight } })]}
                contentInset={{
                    bottom: keyboard.keyboardShown ? keyboard.keyboardHeight - 86 - 32 : 0.1 /* Some weird bug on iOS */, // + 56 + 32
                    top: 0.1 /* Some weird bug on iOS */
                }}
                contentInsetAdjustmentBehavior={'never'}
                keyboardShouldPersistTaps={'always'}
                automaticallyAdjustContentInsets={false}
                scrollEnabled={scrollEnabled}
                nestedScrollEnabled={nestedScrollEnabled}
            >
                <AnimatedWrapper style={seletectInputStyles.address} onLayout={_setAddressInputHeight} key='renderTransferAddress'>
                    {addressComponent}
                </AnimatedWrapper>

                {selected === 'address' && <View style={{ height: addressInputHeight }} />}
                
                <View style={{ marginTop: 16 }}>
                    <AnimatedWrapper delay={10} style={[seletectInputStyles.amount, { flex: 1 }]} onLayout={_setAmountInputHeight} key='renderTransaction'>
                        {amountComponent}
                    </AnimatedWrapper>
                </View>

                <View style={{ marginTop: 16 }}>
                    <AnimatedWrapper delay={20} style={[ seletectInputStyles.comment, { flex: 1 } ]} key='renderSmartContract'>
                        {commentComponent}
                    </AnimatedWrapper>
                </View>

                {!!feesComponent && 
                    <View style={{ marginTop: 16 }}>
                        <AnimatedWrapper delay={30} style={[ seletectInputStyles.fees, { flex: 1 } ]} key='renderEstimation'>
                            {feesComponent}
                        </AnimatedWrapper>
                    </View>
                }
                <View style={{ height: 56 }} />
            </ScrollView>
            {footerComponent}
        </View>
    )
}))

const styles = StyleSheet.create({
    disabled: { opacity: 0, pointerEvents: 'none' },
    disabledHeight: { height: 0 },

    addressAddress: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 1, zIndex: 1 },
    amountAmount: { position: 'relative', left: 0, right: 0, opacity: 1, zIndex: 1 },
    commentComment: { position: 'absolute', left: 0, right: 0, opacity: 1, zIndex: 1 },

    default: { opacity: 1 }
})