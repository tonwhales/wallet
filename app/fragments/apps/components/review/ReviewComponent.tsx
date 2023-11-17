import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { View, Text, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput, ATextInputRef } from "../../../../components/ATextInput";
import { RoundButton } from "../../../../components/RoundButton";
import { fetchExtensionReview, postExtensionReview } from "../../../../engine/api/reviews";
import { t } from "../../../../i18n/t";
import { getCurrentAddress } from "../../../../storage/appState";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { StarRating } from "./StarRating";
import { useTheme } from '../../../../engine/hooks';
import { useAppData } from '../../../../engine/hooks';
import { useNetwork } from "../../../../engine/hooks/network/useNetwork";
import { WImage } from "../../../../components/WImage";

export const ReviewComponent = memo(({ url }: { url: string }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const appData = useAppData(url);
    const safeArea = useSafeAreaInsets();
    const address = useMemo(() => getCurrentAddress().address, []);
    const navigation = useTypedNavigation();

    const [loading, setLoading] = useState(true);
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
            backgroundColor: theme.backgroundPrimary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    const onSend = useCallback(async () => {
        try {
            await postExtensionReview(url, {
                rating,
                address: address.toString({ testOnly: isTestnet }),
                comment: review.length > 0 ? {
                    text: review,
                    images: []
                } : null,
            });

            navigation.navigateAlert({ title: t('review.posted'), message: t('review.postedDescription') }, true)
        } catch (error) {
            Alert.alert(t('review.error'));
        }
    }, [address, rating, review]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                // TODO rewrite using new hooks
                const selectedAddress = getCurrentAddress();
                const reviewRes = await fetchExtensionReview(selectedAddress.address, url, isTestnet);
                if (reviewRes) {
                    setRating(reviewRes.rating);
                    if (reviewRes.comment) setReview(reviewRes.comment.text);
                }
            } catch (error) { }
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
                <View style={{ alignItems: 'center' }}>
                    <WImage
                        heigh={72}
                        width={72}
                        src={appData?.image?.preview256}
                        blurhash={appData?.image?.preview256}
                        style={{ marginRight: 10 }}
                        borderRadius={16}
                    />
                    <Text
                        style={{
                            fontSize: 24,
                            marginHorizontal: 16,
                            textAlign: 'center',
                            color: theme.textPrimary,
                            fontWeight: '600',
                            marginTop: 16
                        }}
                    >
                        {appData?.title}
                    </Text>
                    <StarRating
                        initial={rating}
                        onSet={setRating}
                        style={{ marginVertical: 24 }}
                    />
                    <View style={{ width: '100%' }}>
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            marginHorizontal: 16,
                            paddingVertical: 20,
                            borderRadius: 20,
                            marginTop: 5
                        }}>
                            <ATextInput
                                value={review}
                                onValueChange={setReview}
                                keyboardType="default"
                                autoCapitalize="sentences"
                                style={{ paddingHorizontal: 16 }}
                                multiline
                                label={t('review.review')}
                                blurOnSubmit={true}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                keyboardVerticalOffset={16}
            >
                <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                    <RoundButton title={t('common.send')} action={onSend} disabled={rating < 1} />
                </View>
            </KeyboardAvoidingView>

            <Animated.View
                style={animatedStyles}
                pointerEvents={loading ? 'box-none' : 'none'}
            >
                <ActivityIndicator size="large" color={theme.accent} />
            </Animated.View>
        </>
    );
});