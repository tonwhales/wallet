import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { ButtonElement } from "../../../engine/ai/markup-types";
import { Typography } from "../../styles";
import { useTheme } from "../../../engine/hooks";
import { openWithInApp } from "../../../utils/openWithInApp";
import ShareIcon from '@assets/ic-share.svg';
import ChevronIcon from '@assets/ic_chevron_forward.svg';

export const MessageButton = memo(({ element }: { element: ButtonElement }) => {
    const theme = useTheme();
    const { url, title, icon } = element.attributes;

    const handlePress = () => {
        openWithInApp(url);
    };

    const renderIcon = () => {
        const iconSize = 16;
        const iconColor = theme.white;

        switch (icon) {
            case 'external':
                return <ShareIcon width={iconSize} height={iconSize} color={iconColor} />;
            case 'download':
                return <ChevronIcon width={iconSize} height={iconSize} color={iconColor} />;
            case 'link':
                return <ChevronIcon width={iconSize} height={iconSize} color={iconColor} />;
            default:
                return null;
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => ({
                backgroundColor: theme.accent,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.7 : 1,
            })}
        >
            {icon && (
                <View style={{ marginRight: 4 }}>
                    {renderIcon()}
                </View>
            )}
            <Text style={[Typography.semiBold15_20, { color: theme.white }]}>
                {title}
            </Text>
        </Pressable>
    );
});

