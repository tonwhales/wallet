import React, { useCallback, useEffect, useState } from "react"
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput } from "../../../../components/ATextInput";
import { RoundButton } from "../../../../components/RoundButton";
import { fetchExtensionReview, postExtensionReview } from "../../../../engine/api/reviews";
import { useEngine } from "../../../../engine/Engine";
import { t } from "../../../../i18n/t";
import { getCurrentAddress } from "../../../../storage/appState";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { StarRating } from "./StarRating";
import { useAppConfig } from "../../../../utils/AppConfigContext";

export const ReviewComponent = React.memo(({ url }: { url: string }) => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const appData = engine.products.extensions.useAppData(url);
    const safeArea = useSafeAreaInsets();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const navigation = useTypedNavigation();
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [rating, setRating] = useState<number>(0);
    const [review, setReview] = useState<string>('');

    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Theme.background,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    const onSend = useCallback(
        async () => {
            setSending(true);
            try {
                await postExtensionReview(url, {
                    rating,
                    address: address.toFriendly({ testOnly: AppConfig.isTestnet }),
                    comment: review.length > 0 ? {
                        text: review,
                        images: []
                    } : null,
                });

                Alert.alert(t('review.posted'), undefined, [{
                    onPress: () => {
                        navigation.goBack();
                    }
                }]);
            } catch (error) {
                Alert.alert(t('review.error'));
            }
            setSending(false);
        },
        [address, rating, review],
    );

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const reviewRes = await fetchExtensionReview(engine.address, url);
                if (reviewRes) {
                    setRating(reviewRes.rating);
                    if (reviewRes.comment) setReview(reviewRes.comment.text);
                }
            } catch (error) {
            }
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (loading) {
            opacity.value = 1;
            return;
        };
        opacity.value = 0;
    }, [loading]);


    return (
        <>
            <ScrollView
                style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                alwaysBounceVertical={false}
            >
                <Text
                    style={{
                        fontSize: 24,
                        marginHorizontal: 16,
                        textAlign: 'center',
                        color: Theme.textColor,
                        fontWeight: '600',
                        marginTop: 10
                    }}
                >
                    {appData?.title}
                </Text>
                <StarRating
                    initial={rating}
                    onSet={setRating}
                    style={{
                        marginVertical: 16
                    }}
                />
                <View style={{
                    marginBottom: 16, marginTop: 2,
                    marginHorizontal: 16,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <ATextInput
                        value={review}
                        onValueChange={setReview}
                        keyboardType="default"
                        autoCapitalize="sentences"
                        style={{ backgroundColor: Theme.transparent, paddingHorizontal: 0, marginHorizontal: 16 }}
                        preventDefaultHeight
                        multiline
                        label={
                            <View style={{
                                flexDirection: 'row',
                                width: '100%',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                overflow: 'hidden',
                            }}>
                                <Text style={{
                                    fontWeight: '500',
                                    fontSize: 12,
                                    color: Theme.label,
                                    alignSelf: 'flex-start',
                                }}>
                                    {t('review.review')}
                                </Text>
                            </View>
                        }
                    />
                </View>
            </ScrollView>
            <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                <RoundButton title={t('common.send')} onPress={onSend} disabled={rating < 1 || sending} loading={sending} />
            </View>

            <Animated.View
                style={animatedStyles}
                pointerEvents={loading ? 'box-none' : 'none'}
            >
                <ActivityIndicator size="large" color={Theme.accent} />
            </Animated.View>
        </>
    );
});