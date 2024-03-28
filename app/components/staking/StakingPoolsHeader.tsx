import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { ItemHeader } from "../ItemHeader";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";

export const StakingPoolsHeader = memo((props: {
    text: string,
    description?: string,
    action?: { title: string, onAction: () => void }
}) => {
    const theme = useTheme();

    return (
        <View style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16
        }}>
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <ItemHeader
                    title={props.text}
                    style={{ flexShrink: 1 }}
                />
                {!!props.action && (
                    <Pressable style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1,
                            alignSelf: 'flex-end',
                        }
                    }}
                        onPress={props.action.onAction}
                    >
                        <Text style={[{ color: theme.accent, textAlign: 'right' }, Typography.medium15_20]}
                            numberOfLines={1}
                        >
                            {props.action.title}
                        </Text>
                    </Pressable>
                )}
            </View>
            {!!props.description && (
                <Text style={[{
                    color: theme.textSecondary,
                    marginTop: 2
                }, Typography.regular15_20]}>
                    {props.description}
                </Text>
            )}
        </View>
    );
})

