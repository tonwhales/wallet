import { useRoute } from "@react-navigation/native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GhostButton } from "../../components/GhostButtom";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const LegalFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();
    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', alignItems: 'stretch' }}>
            <Text style={{ marginHorizontal: 24, fontSize: 24 }}>
                Legal
            </Text>
            <Text style={{ marginHorizontal: 24, marginTop: 8, fontSize: 18 }}>
                Please review the Tonton Wallet Privacy Policy and Terms of Service.
            </Text>
            <View style={{ flexGrow: 1 }} />
            <GhostButton onClick={() => { }} text="Privacy policy" />
            <View style={{ height: 16 }} />
            <GhostButton onClick={() => { }} text="Terms of service" />
            <View style={{ height: 64, marginHorizontal: 64, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title="Accept" onPress={() => route.name === 'LegalCreate' ? navigation.replace('WalletCreate') : navigation.replace('WalletImport')} />
            </View>
        </View>
    );
});