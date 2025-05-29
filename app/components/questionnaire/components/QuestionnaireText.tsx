import { memo, useState } from "react";
import { Platform, TextInput as RNTextInput } from "react-native";
import { useTheme } from "../../../engine/hooks";
import { Typography } from "../../styles";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

interface Props {
    questionId: number;
    value?: string;
    onAnswer: (questionId: number, value: string) => void;
}

const TextInput = Platform.OS === 'android' ? RNTextInput : BottomSheetTextInput;

export const QuestionnaireText = memo(({ questionId, value, onAnswer }: Props) => {
    const theme = useTheme();
    const [localValue, setLocalValue] = useState(value || '');

    const handleTextChange = (text: string) => {
        setLocalValue(text);
        onAnswer(questionId, text);
    };

    return (
        <TextInput
            style={[{ 
                color: theme.textPrimary, 
                textAlign: 'left', 
                maxHeight: 100, 
                borderWidth: 1, 
                backgroundColor: theme.surfaceOnBg, 
                borderColor: theme.border, 
                borderRadius: 10, 
                padding: 12 
            }, Typography.regular15_20]}
            onChangeText={handleTextChange}
            value={localValue}
            maxLength={1000}
            multiline={true}
            scrollEnabled={true}
        />
    )
}); 