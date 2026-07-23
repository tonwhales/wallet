import { View, StyleSheet } from "react-native";
import { useKeyboard } from '@react-native-community/hooks';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import { Dispatch, forwardRef, memo, ReactNode, SetStateAction, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { SimpleTransferAnimatedWrapper } from "./SimpleTransferAnimatedWrapper";
import { ASSET_ITEM_HEIGHT } from "../../../../utils/constants";
import { useCurrentAddress, useNetwork } from "../../../../engine/hooks";
import { MaestraEvent, trackMaestraEvent } from "../../../../analytics/maestra";
import { useHoldersProfile } from "../../../../engine/hooks/holders/useHoldersProfile";

type Props = {
    headerComponent: ReactNode;
    footerComponent: ReactNode;
    addressComponent: ReactNode;
    amountComponent: ReactNode;
    commentComponent: ReactNode;
    feesComponent?: ReactNode;
    scrollEnabled: boolean;
    nestedScrollEnabled: boolean;
    selected: "address" | "amount" | "comment" | null;
    setIsScrolling: Dispatch<SetStateAction<boolean>>;
}

export const SimpleTransferLayout = memo(forwardRef(({
    headerComponent,
    footerComponent,
    scrollEnabled,
    nestedScrollEnabled,
    addressComponent,
    amountComponent,
    commentComponent,
    feesComponent,
    selected,
    setIsScrolling
}: Props, ref) => {
    const keyboard = useKeyboard();
    const { tonAddress } = useCurrentAddress();
    const { isTestnet } = useNetwork();
    const profile = useHoldersProfile(tonAddress!.toString({ testOnly: isTestnet })).data;

    const innerRef = useRef<Animated.ScrollView>(null)
    useImperativeHandle(ref, () => innerRef.current)

    const scrollOffsetSv = useSharedValue(0)
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollOffsetSv.value = event.contentOffset.y;
    });

    const contentInset = useMemo(() => {
        return {
            // bottom: 0.1,
            bottom: keyboard.keyboardShown ? keyboard.keyboardHeight - ASSET_ITEM_HEIGHT - 32 : 0.1 /* Some weird bug on iOS */, // + 56 + 32
            top: 0.1 /* Some weird bug on iOS */
        }
    }, [keyboard.keyboardShown, keyboard.keyboardHeight]);

    useEffect(() => {
        if (isTestnet) {
            return;
        }
        trackMaestraEvent(MaestraEvent.ViewSendPage, { walletID: tonAddress.toString(), tonhubID: profile?.userId });
    }, []);

    return (
        <View style={styles.container}>
            {headerComponent}
            <NativeViewGestureHandler disallowInterruption={true}>
                <Animated.ScrollView
                    ref={innerRef}
                    onScroll={scrollHandler}
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContentContainer}
                    contentInset={contentInset}
                    contentInsetAdjustmentBehavior={'never'}
                    keyboardShouldPersistTaps={'handled'}
                    automaticallyAdjustContentInsets={false}
                    scrollEnabled={scrollEnabled}
                    nestedScrollEnabled={nestedScrollEnabled}
                    onScrollBeginDrag={() => setIsScrolling(true)}
                    onScrollEndDrag={() => setIsScrolling(false)}
                >
                    {[
                        { type: 'address', component: addressComponent },
                        { type: 'amount', component: amountComponent },
                        { type: 'comment', component: commentComponent },
                    ].map(({ type, component }, index) => (
                        <SimpleTransferAnimatedWrapper selected={selected} key={type} delay={index * 10} isActive={selected ? selected === type : selected} scrollOffsetSv={scrollOffsetSv}>
                            {component}
                        </SimpleTransferAnimatedWrapper>
                    ))}

                    {!!feesComponent &&
                        <SimpleTransferAnimatedWrapper selected={selected} delay={30} noAnimation isActive={selected === null ? null : false} scrollOffsetSv={scrollOffsetSv}>
                            {feesComponent}
                        </SimpleTransferAnimatedWrapper>
                    }
                </Animated.ScrollView>
            </NativeViewGestureHandler>
            {footerComponent}
        </View>
    )
}))

const styles = StyleSheet.create({
    container: { flexGrow: 1 },
    scrollContainer: { flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', marginTop: 16 },
    scrollContentContainer: { marginHorizontal: 16, flexGrow: 1, paddingBottom: 56, rowGap: 16 }
})