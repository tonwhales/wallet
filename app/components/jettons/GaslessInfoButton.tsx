import { memo, useCallback } from "react";
import { Pressable, Text } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks";
import { Image } from "expo-image";
import { t } from "../../i18n/t";
import { Typography } from "../styles";

export const GaslessInfoButton = memo(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const onPress = useCallback(() => {
        navigation.navigateAlert({
            title: t('common.gasless'),
            message: t('w5.gaslessInfo'),
        });
    }, []);
    return (
        <Pressable
            style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                flexDirection: 'row',
                justifyContent: 'center', alignItems: 'center',
                marginLeft: 4, gap: 4
            })}
            onPress={onPress}
        >
            <Image
                style={{ height: 18, width: 18 }}
                source={require('@assets/ic-gasless.png')}
            />
            <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                {t('common.gasless')}
            </Text>
        </Pressable>
    )
})