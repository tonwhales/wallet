import { memo } from "react";
import { Pressable, Text } from "react-native";
import { NavElement } from "../../../engine/ai/markup-types";
import { Typography } from "../../styles";
import { useTheme } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import ChevronRightIcon from '@assets/ic_chevron_forward.svg';

export const MessageNav = memo(({ element }: { element: NavElement }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const { route, title, params } = element.attributes;

    const handlePress = () => {
        try {
            const parsedParams = params ? JSON.parse(params) : undefined;
            navigation.navigate(route, parsedParams);
        } catch (error) {
            console.warn('Failed to navigate:', error);
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => ({
                backgroundColor: theme.surfaceOnElevation,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: pressed ? 0.7 : 1,
            })}
        >
            <Text style={[Typography.semiBold15_20, { color: theme.textPrimary }]}>
                {title}
            </Text>
            <ChevronRightIcon
                width={20}
                height={20}
                color={theme.iconPrimary}
            />
        </Pressable>
    );
});

