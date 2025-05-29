import { Pressable, Text, View } from "react-native";
import { memo } from "react";
import { useTheme } from "../../../engine/hooks";
import { Typography } from "../../styles";

interface Props {
    questionId: number;
    options: string[];
    selectedValue?: string;
    onAnswer: (questionId: number, value: string) => void;
}

export const QuestionnaireRadio = memo(({ questionId, options, selectedValue, onAnswer }: Props) => {
    const theme = useTheme();

    return (
        <View style={{ gap: 8 }}>
            {options.map((option) => {
                const isSelected = selectedValue === option;
                return (
                    <Pressable
                        key={option}
                        onPress={() => onAnswer(questionId, option)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            backgroundColor: isSelected ? theme.surfaceOnBg : 'transparent',
                            borderWidth: 1,
                            borderColor: theme.surfaceOnBg,
                        }}
                    >
                        <View style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: isSelected ? theme.accent : theme.surfaceOnBg,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                            backgroundColor: theme.surfaceOnBg,
                        }}>
                            {isSelected && (
                                <View style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: theme.accent,
                                }} />
                            )}
                        </View>
                        <Text style={[{
                            color: isSelected ? theme.textPrimary : theme.textPrimary,
                            textAlign: 'left'
                        }, Typography.regular15_20]}>
                            {option}
                        </Text>
                    </Pressable>
                )
            })}
        </View>
    )
}); 