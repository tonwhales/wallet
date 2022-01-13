import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';

export const WalletCreatedFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View style={{ flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', backgroundColor: 'white' }}>
            <View style={{ flexGrow: 1 }} />
            <LottieView
                source={require('../../../assets/animations/folders.json')}
                autoPlay={true}
                loop={true}
                style={{ width: 128, height: 128, marginBottom: 8 }}
            />
            <Text style={{ marginHorizontal: 24, fontSize: 30, fontWeight: '700' }}>
                Backup your wallet
            </Text>
            <Text style={{ marginHorizontal: 24, marginTop: 8, fontSize: 16, textAlign: 'center' }}>
                You will be shown a secret recovery phrase on the next screen. The recovery phrase is the only key to your wallet.
            </Text>
            <Text style={{ marginHorizontal: 24, marginTop: 8, fontSize: 16, textAlign: 'center' }}>
                It will allow you to recover access to your wallet if your phone is lost or stolen.
            </Text>
            <View style={{ flexGrow: 1 }} />
            <View style={{ marginHorizontal: 24, marginBottom: 32 }}>
                <Text style={{ fontSize: 18, marginVertical: 4 }}>
                    ⚠️ If I lose revovery phase, my funds will be lost forever.
                </Text>
                <Text style={{ fontSize: 18, marginVertical: 4 }}>
                    ⚠️ If I expose or share my revovery phrase to anybody, my funds can be stolen.
                </Text>
                <Text style={{ fontSize: 18, marginVertical: 4 }}>
                    ⚠️ It is my full responsibility to keep my revovery phrase secure.
                </Text>
            </View>
            <View style={{ height: 64, marginHorizontal: 64, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title="Back up now" onPress={() => navigation.navigate('WalletBackupInit')} />
            </View>
        </View>
    );
});