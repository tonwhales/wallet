import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo } from '../../components/AppLogo';
import { RoundButton } from '../../components/RoundButton';
import { fragment } from "../../fragment";
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import Animated, { FadeIn, FadeOutDown } from 'react-native-reanimated';
import { Theme } from '../../Theme';
import LottieView from 'lottie-react-native';

export const WelcomeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ref = React.useRef<LottieView>(null);
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, backgroundColor: '#fff' }}>
            <View style={{ height: 128, marginTop: safeArea.bottom }} />
            <View style={{ flexGrow: 1 }} />
            <Text style={{ fontSize: 32, opacity: 0 }}>Tonton</Text>
            <Text style={{ fontSize: 18, marginTop: 8, opacity: 0 }}>Fast and secure Toncoin Wallet</Text>
            <View style={{ alignItems: 'center' }}>
                <Image source={require('../../../assets/logo.png')} style={{ width: 256, height: 256, opacity: 0 }} resizeMode="cover" />
                <View style={{ position: 'absolute', top: 23, width: 210, height: 210 }}>
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
                <Text
                    style={{ fontSize: 32 }}
                >
                    Tonton
                </Text>
                <View
                    style={{ marginTop: 8 }}
                >
                    <Text style={{ fontSize: 18, color: Theme.textColor }}>
                        Fast and secure Toncoin Wallet
                    </Text>
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 128, marginHorizontal: 64, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title="Create wallet" onPress={() => navigation.navigate('LegalCreate')} />
                <RoundButton title="I have existing wallet" onPress={() => navigation.navigate('LegalImport')} display="inverted" size="normal" style={{ marginTop: 16 }} />
            </View>
        </View>
    );
});