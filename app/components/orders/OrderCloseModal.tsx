import { Dimensions, Platform, Text } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetModalProvider, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { useSupport, useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { RoundButton } from "../RoundButton";
import { BottomSheetScrollViewMethods } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "../../i18n/t";
import { ThemeStyle } from "../../engine/state/theme";

interface Props {
    isClosing?: boolean;
    onClose?: () => void;
}

export const OrderCloseModal = forwardRef<BottomSheetModal, Props>((props, ref) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const scrollViewRef = useRef<BottomSheetScrollViewMethods>(null);
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const { onSupport } = useSupport();

    useImperativeHandle(ref, () => bottomSheetRef.current!, []);

    const onContinue = useCallback(() => {
        props.onClose?.();
    }, [props]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ), []);

    const title = useMemo(() => {
        return (
            <Text style={[{ color: theme.textPrimary, marginBottom: 24 }, Typography.semiBold32_38]}>
                {t('order.orderCloseTitle')}
            </Text>
        )
    }, [theme]);

    const description = useMemo(() => {
        return (
            <Text style={[{ color: theme.textPrimary, textAlign: 'left', marginBottom: 16 }, Typography.regular17_24]}>
                {t('order.orderCloseDescription')}
            </Text>
        )
    }, [theme]);

    const buttons = useMemo(() => {
        return (
            <>
                <RoundButton title={t('order.orderCloseConfirm')} onPress={onContinue} style={{ marginTop: 24 }} loading={props.isClosing} />
                <RoundButton title={t('order.contactSupport')} display="secondary" onPress={onSupport} style={{ marginTop: 16 }} />
            </>
        )
    }, [onContinue, onSupport]);

    return (
        <BottomSheetModalProvider>
            <BottomSheetModal
                ref={bottomSheetRef}
                onDismiss={() => { }}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                enableDynamicSizing={true}
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
                handleIndicatorStyle={{
                    backgroundColor: theme.divider,
                }}
                backgroundStyle={{
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    backgroundColor: theme.style === ThemeStyle.Light ? theme.backgroundPrimary : theme.surfaceOnBg,
                }}
            >
                <BottomSheetScrollView
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                    ref={scrollViewRef}
                    contentContainerStyle={[{
                        padding: 24,
                        paddingBottom: Platform.select({
                            android: safeArea.bottom + 16,
                            ios: safeArea.bottom + 16
                        })
                    }]}>
                    {title}
                    {description}
                    {buttons}
                </BottomSheetScrollView>
            </BottomSheetModal>
        </BottomSheetModalProvider >
    )
});