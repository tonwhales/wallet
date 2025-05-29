import { Pressable, Text, View } from "react-native";
import { memo } from "react";
import { useTheme } from "../../../engine/hooks";
import { Typography } from "../../styles";

interface Props {
    questionId: number;
    selectedValue?: string;
    onAnswer: (questionId: number, value: string) => void;
}

export const QuestionnaireRate = memo(({ questionId, selectedValue, onAnswer }: Props) => {
    const theme = useTheme();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((rate) => {
                const isSelected = selectedValue === rate;
                return (
                    <Pressable
                        key={rate}
                        onPress={() => onAnswer(questionId, isSelected ? '' : rate)}
                        style={{
                            flex: 1,
                            height: 40,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isSelected ? theme.accent : theme.surfaceOnBg
                        }}
                    >
                        <Text style={[{ color: isSelected ? theme.textPrimaryInverted : theme.textPrimary, textAlign: 'left' }, Typography.regular15_20]}>
                            {rate}
                        </Text>
                    </Pressable>
                )
            })}
        </View>
    )
}); 