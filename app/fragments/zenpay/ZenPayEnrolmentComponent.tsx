import React, { useCallback } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { RoundButton } from "../../components/RoundButton";
import { Engine } from "../../engine/Engine";
import { t } from "../../i18n/t";

export const ZenPayEnrolmentComponent = React.memo(({ engine }: { engine: Engine }) => {
    const safeArea = useSafeAreaInsets();
    const onEnroll = useCallback(async () => {
        // TODO: run in backoff
        const res = await engine.products.zenPay.enroll();
    }, []);

    return (
        <>
            <View style={{ backgroundColor: 'white', flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <AndroidToolbar pageTitle={t('products.zenPay.title')} />
                {Platform.OS === 'ios' && (
                    <>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ height: 4, width: 35, borderRadius: 5, backgroundColor: '#CFCBCB', marginTop: 6 }} />
                        </View>
                        <View style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 14,
                            paddingHorizontal: 15,
                            justifyContent: 'center'
                        }}>
                            <Pressable
                                style={({ pressed }) => {
                                    return ({
                                        opacity: pressed ? 0.3 : 1,
                                        position: 'absolute', top: 0, bottom: 0, left: 15
                                    });
                                }}
                                onPress={close}
                            >
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 17,
                                    textAlign: 'center',
                                }}>
                                    {t('common.close')}
                                </Text>
                            </Pressable>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 17,
                                textAlign: 'center'
                            }}>
                                {t('products.zenPay.title')}
                            </Text>
                        </View>
                    </>
                )}
                <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>
                        {'Needs enrollement'}
                    </Text>

                    <View
                        style={{
                            position: 'absolute', bottom: safeArea.bottom + 16, left: 0, right: 0, paddingHorizontal: 16
                        }}
                    >
                        <RoundButton
                            title={'Enroll'}
                            action={onEnroll}
                            style={{
                                height: 56,
                            }}
                        />
                    </View>
                </View>
            </View>
        </>
    );
});