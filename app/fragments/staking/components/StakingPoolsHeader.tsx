import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { ItemHeader } from "../../../components/ItemHeader";
import { useTheme } from "../../../engine/hooks";

export const StakingPoolsHeader = memo((props: {
    text: string,
    description?: string,
    action?: { title: string, onAction: () => void }
}) => {
    const theme = useTheme();

    return (
        <View style={{
            paddingHorizontal: 20,
            paddingTop: 20,
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
                        <Text style={{
                            fontSize: 15, lineHeight: 20,
                            fontWeight: '500',
                            color: theme.accent,
                            textAlign: 'right'
                        }}
                            numberOfLines={1}
                        >
                            {props.action.title}
                        </Text>
                    </Pressable>
                )}
            </View>
            {!!props.description && (
                <Text style={{
                    maxWidth: '70%',
                    fontSize: 14, color: theme.textSecondary,
                    marginTop: 2
                }}>
                    {props.description}
                </Text>
            )}
        </View>
    );
})

