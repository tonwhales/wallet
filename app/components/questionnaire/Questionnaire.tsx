import { Dimensions, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetModalProvider, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRef, useCallback, useMemo, useEffect } from "react";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { RoundButton } from "../RoundButton";
import { BottomSheetScrollViewMethods } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types";
import { QuestionnaireRate, QuestionnaireRadio, QuestionnaireCheckBox, QuestionnaireText } from "./components";
import { Question, useQuestionnaire } from "./hooks/useQuestionnaire";

export const Questionnaire = () => {
    const {
        answers,
        questions,
        questionnaireTitle,
        handleAnswer,
        toggleCheckboxAnswer,
        isFormCompleted
    } = useQuestionnaire();

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const scrollViewRef = useRef<BottomSheetScrollViewMethods>(null);
    const theme = useTheme();

    useEffect(() => {
        setTimeout(() => {
            bottomSheetRef.current?.present();
        }, 1000);
    }, []);

    useEffect(() => {
        if (isFormCompleted) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            });
        }
    }, [isFormCompleted]);

    const onSubmit = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    const renderAnswer = useCallback((question: Question) => {
        const { id, answerFormat, options } = question;

        switch (answerFormat) {
            case 'rate':
                return (
                    <QuestionnaireRate
                        questionId={id}
                        selectedValue={answers[id] as string}
                        onAnswer={handleAnswer}
                    />
                )
            case 'radio':
                return (
                    <QuestionnaireRadio
                        questionId={id}
                        options={options || []}
                        selectedValue={answers[id] as string}
                        onAnswer={handleAnswer}
                    />
                )
            case 'checkbox':
                return (
                    <QuestionnaireCheckBox
                        questionId={id}
                        options={options || []}
                        selectedValues={answers[id] as string[] || []}
                        onToggle={toggleCheckboxAnswer}
                    />
                )
            case 'text':
                return (
                    <QuestionnaireText
                        questionId={id}
                        value={answers[id] as string}
                        onAnswer={handleAnswer}
                    />
                )
        }
    }, [answers, handleAnswer, toggleCheckboxAnswer]);

    const title = useMemo(() => {
        return (
            <Text style={[{ color: theme.textPrimary, textAlign: 'center', marginBottom: 24 }, Typography.semiBold32_38]}>
                {questionnaireTitle}
            </Text>
        )
    }, [questionnaireTitle, theme.textPrimary]);

    const questionsList = useMemo(() => {
        return (
            <View style={{ gap: 32 }}>
                {questions.map((question) => {
                    return (
                        <View key={question.id}>
                            <Text style={[{ color: theme.textPrimary, textAlign: 'left', marginBottom: 16 }, Typography.semiBold17_24]}>
                                {question.title}
                            </Text>
                            {renderAnswer(question)}
                        </View>
                    )
                })}
            </View>
        )
    }, [questions, renderAnswer, theme.textPrimary]);

    const button = useMemo(() => {
        if (isFormCompleted) {
            return (
                <RoundButton title="Submit" onPress={onSubmit} style={{ marginTop: 24 }} />
            )
        }
        return null;
    }, [isFormCompleted]);

    return (
        <BottomSheetModalProvider>
            <BottomSheetModal
                ref={bottomSheetRef}
                onDismiss={() => {
                    setTimeout(() => {
                        bottomSheetRef.current?.present();
                    }, 1000);
                }}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                enableDynamicSizing={true}
                maxDynamicContentSize={Dimensions.get('window').height * 0.61}
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
                backgroundStyle={{
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                }}
            >
                <BottomSheetScrollView
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                    ref={scrollViewRef}
                    contentContainerStyle={{
                        padding: 24,
                        paddingBottom: 36,
                    }}>
                    {title}
                    {questionsList}
                    {button}
                </BottomSheetScrollView>
            </BottomSheetModal>
        </BottomSheetModalProvider >
    )
}