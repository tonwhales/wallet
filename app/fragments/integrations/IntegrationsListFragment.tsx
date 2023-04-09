import { Platform, View, Text, Image, Pressable } from "react-native";
import { fragment } from "../../fragment";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { t } from "../../i18n/t";
import { ScrollView } from "react-native-gesture-handler";
import { CloseButton } from "../../components/CloseButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Theme } from "../../Theme";
import TransakLogo from '../../../assets/ic_transak.svg';
import Chevron from '../../../assets/ic_chevron_down.svg'

const NeocryptoLogo = require('../../../assets/known/neocrypto_logo.png');

export const IntegrationsListFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('integrations.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('integrations.title')}
                    </Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    borderRadius: 14,
                    paddingHorizontal: 16
                }}>
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1,
                                backgroundColor: Theme.item,
                                borderRadius: 16,
                                marginBottom: 8
                            }
                        }}
                        onPress={() => {
                            navigation.navigate('Transak');
                        }}
                    >
                        <View style={{ flexDirection: 'row', paddingVertical: 10, alignItems: 'center' }}>
                            <View style={{ height: 80, width: 80, marginHorizontal: 10 }}>
                                <TransakLogo height={80} width={80} />
                            </View>
                            <View style={{
                                flex: 1, flexGrow: 1,
                                justifyContent: 'center',
                            }}>
                                <Text style={{
                                    fontWeight: '800',
                                    fontSize: 20,
                                    color: Theme.textColor, marginBottom: 4
                                }}>
                                    {t('integrations.transak.title')}
                                </Text>
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 14,
                                    color: Theme.textColor
                                }}>
                                    {t('integrations.transak.tagline')}
                                </Text>
                            </View>
                            <Chevron style={{ flex: 1, transform: [{ rotate: '-90deg' }], marginRight: 8 }} />
                        </View>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1,
                                backgroundColor: Theme.item,
                                borderRadius: 16
                            }
                        }}
                        onPress={() => {
                            navigation.navigate('Neocrypto');
                        }}
                    >
                        <View style={{ flexDirection: 'row', paddingVertical: 10, alignItems: 'center' }}>
                            <View style={{ height: 80, width: 80, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
                                <Image
                                    style={{
                                        width: 70,
                                        height: 70,
                                        overflow: 'hidden'
                                    }}
                                    source={NeocryptoLogo}
                                />
                            </View>
                            <View style={{
                                flex: 1, flexGrow: 1,
                                justifyContent: 'center',
                            }}>
                                <Text style={{
                                    fontWeight: '800',
                                    fontSize: 20,
                                    color: Theme.textColor, marginBottom: 4
                                }}>
                                    {t('integrations.neocrypto.title')}
                                </Text>
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 14,
                                    color: Theme.textColor
                                }}>
                                    {t('integrations.neocrypto.tagline')}
                                </Text>
                            </View>
                            <Chevron style={{ flex: 1, transform: [{ rotate: '-90deg' }], marginRight: 8 }} />
                        </View>
                    </Pressable>

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
    )
});