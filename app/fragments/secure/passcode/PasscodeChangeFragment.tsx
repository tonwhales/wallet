import { View } from "react-native"
import { PasscodeChange } from "../../../components/secure/PasscodeChange";
import { fragment } from "../../../fragment"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import { ScreenHeader } from "../../../components/ScreenHeader";

export const PasscodeChangeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View style={{ flex: 1 }}>
            <ScreenHeader title={t('security.passcodeSettings.changeTitle')} onClosePressed={navigation.goBack} />
            <View style={{ paddingBottom: safeArea.bottom }}>
                <PasscodeChange />
            </View>
        </View>
    );
});