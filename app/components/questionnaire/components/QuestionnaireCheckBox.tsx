import { Text, View } from "react-native";
import { memo } from "react";
import { useTheme } from "../../../engine/hooks";
import { CheckBox } from "../../CheckBox";

interface Props {
    questionId: number;
    options: string[];
    selectedValues?: string[];
    onToggle: (questionId: number, option: string) => void;
}

export const QuestionnaireCheckBox = memo(({ questionId, options, selectedValues = [], onToggle }: Props) => {
    const theme = useTheme();

    return (
        <View style={{ gap: 8 }}>
            {options.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                    <View
                        key={option}
                        style={{
                            borderRadius: 8,
                            backgroundColor: isSelected ? theme.surfaceOnBg : 'transparent',
                            borderWidth: 1,
                            borderColor: theme.surfaceOnBg,
                        }}
                    >
                        <CheckBox
                            checked={isSelected}
                            onToggle={() => onToggle(questionId, option)}
                            text={
                                <Text style={{ color: theme.textPrimary }}>
                                    {option}
                                </Text>
                            }
                            inactiveColor={theme.surfaceOnBg}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                            }}
                            activeOpacity={1}
                        />
                    </View>
                )
            })}
        </View>
    )
}); 