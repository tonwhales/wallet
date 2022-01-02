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
            <Text style={{ marginHorizontal: 16, marginTop: 16, fontSize: 24 }}>
                Legal
            </Text>
            <Text style={{ marginHorizontal: 16, marginTop: 12, fontSize: 18 }}>
                Please review the Tonton Wallet Privacy Policy and Terms of Service.
            </Text>
            <View style={{ height: 32 }} />
            <GhostButton onClick={() => { }} text="Terms of service" />
            <View style={{ height: 16 }} />
            <GhostButton onClick={() => { }} text="Privacy policy" />
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title="Accept" onPress={() => route.name === 'LegalCreate' ? navigation.replace('WalletCreate') : navigation.replace('WalletImport')} />
            </View>
        </View>
    );
});