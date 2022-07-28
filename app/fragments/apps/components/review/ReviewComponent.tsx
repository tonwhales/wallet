import React, { useCallback, useState } from "react"
import { View, Text, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ATextInput } from "../../../../components/ATextInput";
import { RoundButton } from "../../../../components/RoundButton";
import { useEngine } from "../../../../engine/Engine";
import { t } from "../../../../i18n/t";
import { Theme } from "../../../../Theme";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { Rating, StarRating } from "./StarRating";

export const ReviewComponent = React.memo(({ url }: { url: string }) => {
    const engine = useEngine();
    const appData = engine.products.extensions.useAppData(url);
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [rating, setRating] = useState<Rating>(0);
    const [review, setReview] = useState<string>();

    const onSend = useCallback(
        () => {

        },
        [],
    );


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
                    backgroundColor: "white",
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <ATextInput
                        value={review}
                        onValueChange={setReview}
                        placeholder={'Review'}
                        keyboardType="default"
                        autoCapitalize="sentences"
                        style={{ backgroundColor: 'transparent', paddingHorizontal: 0, marginHorizontal: 16 }}
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
                                    color: '#7D858A',
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
                <RoundButton title={t('common.send')} onPress={onSend} disabled={rating < 1} />
            </View>
        </>
    );
});