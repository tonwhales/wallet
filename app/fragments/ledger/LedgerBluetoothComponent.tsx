import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";

export const LedgerBluetoothComponent = React.memo(({ onReset }: { onReset?: () => void }) => {
    const safeArea = useSafeAreaInsets();

    return (
        <View style={{ flexGrow: 1 }}>
            {!!onReset && (
                <View style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    bottom: safeArea.bottom ?? 16,
                    left: 0, right: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingBottom: safeArea.bottom,
                    backgroundColor: Theme.background,
                }}>
                    <RoundButton
                        title={t('common.back')}
                        display="secondary"
                        size="normal"
                        style={{ paddingHorizontal: 8 }}
                        onPress={onReset}
                    />
                </View>
            )}
        </View>
    );
});