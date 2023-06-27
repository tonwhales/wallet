import React from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";

// BottomSheet provider with hooks to show/hide the bottom sheet with passed component
type BottomSheetProviderProps = {
    children: React.ReactNode;
};
type BottomSheetProviderState = {
    visible: boolean,
    component: React.ReactNode,
    snapPoints: (string | number)[] | null,
};
const BottomSheetContext = React.createContext<{
    show: (component: React.ReactNode, snapPoints: (string | number)[]) => void;
    hide: () => void;
} | null>(null);

export const BottomSheetProvider = React.memo((props: BottomSheetProviderProps) => {
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const [state, setState] = React.useState<BottomSheetProviderState>();

    const show = (component: React.ReactNode, snapPoints: (string | number)[]) => {
        setState({ visible: true, component, snapPoints });
    };
    const hide = () => {
        setState({ visible: false, component: null, snapPoints: null });
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
                <BottomSheet
                    index={state.visible ? 0 : -1}
                    snapPoints={state.snapPoints ?? [-1]}
                    enablePanDownToClose={true}
                    keyboardBehavior="interactive"
                    keyboardBlurBehavior="restore"
                    style={{ backgroundColor: 'white', borderTopRightRadius: 20, borderTopLeftRadius: 20 }}
                    containerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingTop: safeArea.top }}
                    onClose={() => {
                        setState(undefined);
                    }}
                >
                    <BottomSheetView
                        pointerEvents="box-none"
                    >
                        {state?.component}
                    </BottomSheetView>
                </BottomSheet>
            )}
        </BottomSheetContext.Provider>
    );
});

export function useBottomSheet() {
    return React.useContext(BottomSheetContext);
}