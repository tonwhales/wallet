import React from "react";
import BottomSheet, { BottomSheetView, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "react-native";

// BottomSheet provider with hooks to show/hide the bottom sheet with passed component
type BottomSheetProviderProps = {
    children: React.ReactNode;
};
type BottomSheetProviderState = {
    visible: boolean,
    component: React.ReactNode,
    snapPoints: (string | number)[] | null,
    footer?: any
};
const BottomSheetContext = React.createContext<{
    show: (component: React.ReactNode, snapPoints: (string | number)[], footer?: any) => void;
    hide: () => void;
} | null>(null);

export const BottomSheetProvider = React.memo((props: BottomSheetProviderProps) => {
    const safeArea = useSafeAreaInsets();
    const [state, setState] = React.useState<BottomSheetProviderState>();
    const sheetRef = React.useRef<BottomSheet>(null);

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
                    <Pressable
                        onPress={() => {
                            sheetRef.current?.close();
                        }}
                        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                    />
                    <BottomSheet
                        ref={sheetRef}
                        index={state.visible ? 0 : -1}
                        snapPoints={state.snapPoints ?? ['95%']}
                        enablePanDownToClose={true}
                        keyboardBehavior="interactive"
                        keyboardBlurBehavior="restore"
                        handleComponent={null}
                        style={{ backgroundColor: 'white', borderTopRightRadius: 20, borderTopLeftRadius: 20 }}
                        containerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingTop: safeArea.top }}
                        onChange={(index) => {
                            if (index === -1) {
                                setState(undefined);
                            }
                        }}
                        footerComponent={state.footer ? (props) => {
                            return (
                                <BottomSheetFooter {...props}>
                                    {state.footer}
                                </BottomSheetFooter>
                            );
                        } : undefined}
                    >
                        <BottomSheetView pointerEvents="box-none">
                            {state.component}
                        </BottomSheetView>
                    </BottomSheet>
                </>
            )}
        </BottomSheetContext.Provider>
    );
});

export function useBottomSheet() {
    return React.useContext(BottomSheetContext);
}