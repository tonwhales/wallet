import { StatusBar } from "expo-status-bar";
import { Platform, View, Text, ScrollView } from "react-native";
import { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { AnimatedProductButton } from "../../components/products/AnimatedProductButton";
import { useEngine } from "../../engine/Engine";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const ProductsFragment = fragment(() => {
    const engine = useEngine();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const extensions = engine.products.extensions.useExtensions();

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('products.productsScreen.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('products.productsScreen.title')}
                    </Text>
                </View>
            )}

            <ScrollView style={{ flexGrow: 1 }}>
                <View style={{
                    marginBottom: 16,
                    marginTop: 24,
                    borderRadius: 14,
                    flexShrink: 1,
                }}>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background, marginHorizontal: 16 }} collapsable={false}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginVertical: 8
                        }}
                        >
                            {t('products.productsScreen.tonProducts')}
                        </Text>
                        {/* TODO */}
                        <Text style={{ fontSize: 28, color: 'orange' }}>
                            {'//TODO: TON products here, ledger, extensions, staking, etc.'}
                        </Text>
                    </View>
                    {/* TODO */}
                    <View style={{ marginTop: 8, backgroundColor: Theme.background, marginHorizontal: 16 }} collapsable={false}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginHorizontal: 16,
                            marginVertical: 8
                        }}
                        >
                            {'Tonhub Bank Card'}
                        </Text>
                        <Text style={{ fontSize: 28, color: 'orange' }}>
                            {'//TODO: ZenPay card here'}
                        </Text>
                    </View>
                    {/* {extensions.map((e) => {
                        return (
                            <AnimatedProductButton
                                entering={FadeInUp}
                                exiting={FadeOutDown}
                                key={e.key}
                                name={e.name}
                                subtitle={e.description ? e.description : e.url}
                                image={e.image?.url}
                                blurhash={e.image?.blurhash}
                                value={null}
                                onLongPress={() => { }}
                                onPress={() => { }}
                                extension={true}
                                style={{ marginVertical: 4 }}
                            />
                        );
                    })} */}
                </View>
            </ScrollView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});