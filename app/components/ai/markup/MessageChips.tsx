import { memo } from "react";
import { Pressable, Text, View, ScrollView } from "react-native";
import { ChipsElement } from "../../../engine/ai/markup-types";
import { Typography } from "../../styles";
import { useTheme } from "../../../engine/hooks";

export const MessageChips = memo(({
    element,
    onChipPress
}: {
    element: ChipsElement;
    onChipPress?: (value: string, title: string) => void;
}) => {
    const theme = useTheme();
    const chips = element.children || [];

    if (chips.length === 0) {
        return null;
    }

    return (
        <View
            style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
            }}
        >
            {chips.map((chip, index) => {
                const { value, title } = chip.attributes;

                return (
                    <Pressable
                        key={`${value}-${index}`}
                        onPress={() => onChipPress?.(value, title)}
                        style={({ pressed }) => ({
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 20,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderColor: theme.divider,
                            opacity: pressed ? 0.7 : 1,
                        })}
                    >
                        <Text style={[Typography.medium17_24, { color: theme.textThird }]}>
                            {title}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
});

