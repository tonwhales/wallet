import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo } from '../../components/AppLogo';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { Theme } from '../../Theme';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

export const WelcomeFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ref = React.useRef<LottieView>(null);
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: '#fff' }}>
            <View style={{ height: 128, marginTop: safeArea.bottom }} />
            <View style={{ flexGrow: 1 }} />
            <View style={{ alignItems: 'center', height: 416, marginTop: 22 + 8 + 34 + 8 }}>
                <View style={{ width: 210, height: 210, marginTop: -14 }}>
                    <Pressable onPress={() => ref.current!.play()}>
                        <LottieView
                            ref={ref}
                            source={require('../../../assets/animations/chiken_standing.json')}
                            style={{ width: 210, height: 210 }}
                            autoPlay={true}
                            loop={false}
                        />
                    </Pressable>
                </View>
                <Text style={{ fontSize: 30, fontWeight: '700', marginTop: 8, height: 34, textAlign: 'center' }}>
                    Tonhub Wallet
                </Text>
                <Text style={{ fontSize: 18, color: Theme.textColor, textAlign: 'center', marginHorizontal: 16, marginTop: 8, height: 22 }}>
                    Easiest and secure TON wallet
                </Text>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 128, marginHorizontal: 64, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t("Create my wallet")} onPress={() => navigation.navigate('LegalCreate')} />
                <RoundButton title={t("Import existing wallet")} onPress={() => navigation.navigate('LegalImport')} display="inverted" size="normal" style={{ marginTop: 16 }} />
            </View>
        </View>
    );
});