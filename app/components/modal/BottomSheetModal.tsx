import React from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, View } from "react-native";

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
    const sheetRef = React.useRef<BottomSheet>(null);

    const show = (component: React.ReactNode, snapPoints: (string | number)[]) => {
        setState({ visible: true, component, snapPoints });
    };
    const hide = () => {
        setState({ visible: false, component: null, snapPoints: ['100%'] });
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
                        style={{ backgroundColor: 'white', borderTopRightRadius: 20, borderTopLeftRadius: 20 }}
                        containerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingTop: safeArea.top }}
                        onChange={(index) => {
                            if (index === -1) {
                                setState(undefined);
                            }
                        }}
                    >
                        <BottomSheetView
                            pointerEvents="box-none"
                        >
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