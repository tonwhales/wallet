import React, { createContext, memo, useContext, useEffect, useRef, useState } from "react";
import BottomSheet, { BottomSheetView, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type BottomSheetProviderProps = {
    children: React.ReactNode;
};
type BottomSheetProviderState = {
    visible: boolean,
    component: React.ReactNode,
    snapPoints: (string | number)[] | null,
    footer?: any
};
const BottomSheetContext = createContext<{
    show: (component: React.ReactNode, snapPoints: (string | number)[], footer?: any) => void;
    hide: () => void;
} | null>(null);

export const BottomSheetProvider = memo((props: BottomSheetProviderProps) => {
    const [state, setState] = useState<BottomSheetProviderState>();
    const sheetRef = useRef<BottomSheet>(null);

    const show = (component: React.ReactNode, snapPoints: (string | number)[], footer?: any) => {
        setState({ visible: true, component, snapPoints, footer });
    };
    const hide = () => {
        setState(undefined);
    };

    return (
        <BottomSheetContext.Provider
            value={{
                show: show,
                hide: hide,
            }}
        >
            {props.children}
            {state && (
                <>
                    {state.visible && (
                        <Animated.View
                            entering={FadeIn}
                            exiting={FadeOut}
                            style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.6)'
                            }}
                        >
                            <Pressable
                                onPress={() => {
                                    sheetRef.current?.close();
                                    hide();
                                }}
                                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                            />
                        </Animated.View>
                    )}
                    <BottomSheet
                        ref={sheetRef}
                        index={state?.visible ? 0 : -1}
                        snapPoints={state?.snapPoints ?? ['95%']}
                        enablePanDownToClose={true}
                        keyboardBehavior={'interactive'}
                        keyboardBlurBehavior={'restore'}
                        handleComponent={null}
                        style={{ backgroundColor: 'white', borderTopRightRadius: 20, borderTopLeftRadius: 20 }}
                        onClose={() => {
                            hide();
                        }}
                        onChange={(index) => {
                            if (index === -1) {
                                setState(undefined);
                            }
                        }}
                        footerComponent={state?.footer ? (props) => {
                            return (
                                <BottomSheetFooter {...props}>
                                    {state?.footer}
                                </BottomSheetFooter>
                            );
                        } : undefined}
                    >
                        <BottomSheetView pointerEvents="box-none">
                            {state?.component}
                        </BottomSheetView>
                    </BottomSheet>
                </>
            )}
        </BottomSheetContext.Provider>
    );
});

export function useBottomSheet() {
    return useContext(BottomSheetContext);
}