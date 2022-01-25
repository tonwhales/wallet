import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { useTranslation } from "react-i18next";

export const WalletCreatedFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { t } = useTranslation();

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
                {t('Back up your wallet')}
            </Text>
            <View
                style={{
                    marginHorizontal: 24, marginBottom: 32,
                    borderRadius: 14,
                    backgroundColor: 'white',
                    paddingVertical: 15,
                    paddingHorizontal: 11,
                    shadowOpacity: 0.07,
                    shadowRadius: 2,
                    shadowOffset: {
                        width: 0,
                        height: 0
                    },
                }}
            >
                <View style={{
                    flexDirection: 'row'
                }}>
                    <Text style={{ fontSize: 16, fontWeight: '400' }}>
                        {t('If I lose revovery phase, my funds will be lost forever.')}
                    </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '400' }}>
                    {t('If I expose or share my revovery phrase to anybody, my funds can be stolen.')}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '400' }}>
                    {t('It is my full responsibility to keep my revovery phrase secure.')}
                </Text>
            </View>
            <Text style={{
                marginHorizontal: 24, marginTop: 8, fontSize: 16, color: 'rgba(109, 109, 113, 1)'
            }}>
                {t('You will be shown a secret recovery phrase on the next screen. The recovery phrase is the only key to your wallet. It will allow you to recover access to your wallet if your phone is lost or stolen.')}
            </Text>
            <View style={{ flexGrow: 1 }} />

            <View style={{ height: 64, marginHorizontal: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t("Back up now")} onPress={() => navigation.navigate('WalletBackupInit')} />
            </View>
        </View>
    );
});