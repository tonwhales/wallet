import { t } from "i18next";
import { View } from "react-native";
import { ItemButton } from "../../components/ItemButton";
import { fragment } from "../../fragment";
import { Theme } from "../../Theme";

export const DeveloperToolsFragment = fragment(() => {
    return (
        <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16 }}>
            <View style={{
                marginBottom: 16, marginTop: 17,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <ItemButton leftIcon={require('../../../assets/ic_sign_out.png')} dangerZone title={t("Switch to testnet")} onPress={() => { }} />
                </View>
            </View>
        </View>
    );
});