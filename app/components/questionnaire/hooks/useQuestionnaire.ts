import { useCallback, useEffect, useMemo, useState } from 'react';

export interface Question {
    id: number;
    title: string;
    answerFormat: 'rate' | 'radio' | 'checkbox' | 'text';
    options?: string[];
}

type Questionnaire = {
    title: string;
    questions: Question[];
}

type Answers = Record<number, string | string[]>;

const fetchSurveyQuestions = async (): Promise<Questionnaire> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
        title: 'Tonhub Card Survey',
        questions: [
            {
                id: 1,
                title: 'How likely are you to recommend Tonhub Card to a friend?',
                answerFormat: 'rate',
            },
            {
                id: 2,
                title: 'Would you recommend our app to your friends?',
                answerFormat: 'radio',
                options: ['😍 Yes', '😐 Maybe', '😡 No'],
            },
            {
                id: 3,
                title: 'What would you like to improve?',
                answerFormat: 'text',
            },
            {
                id: 4,
                title: 'What features do you use?',
                answerFormat: 'checkbox',
                options: ['Crypto wallet', 'Card', 'Browser', 'Ledger'],
            },
        ]
    }
};

export const useQuestionnaire = () => {
    const [answers, setAnswers] = useState<Answers>({});
    const [questions, setQuestions] = useState<Question[]>([]);
    const [questionnaireTitle, setQuestinnaireTitle] = useState<string>('');

    useEffect(() => {
        const loadQuestions = async () => {
            const data = await fetchSurveyQuestions();
            setQuestions(data.questions);
            setQuestinnaireTitle(data.title);
        };

        loadQuestions();
    }, []);

    const handleAnswer = useCallback((questionId: number, value: string | string[]) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }, []);

    const updateAnswer = useCallback((questionId: number, updater: (current: string | string[]) => string | string[]) => {
        setAnswers((prev) => {
            const currentValue = prev[questionId] || [];
            const newValue = updater(currentValue);
            return { ...prev, [questionId]: newValue };
        });
    }, []);

    const toggleCheckboxAnswer = useCallback((questionId: number, option: string) => {
        updateAnswer(questionId, (current) => {
            const selected = (current as string[]) || [];
            const isOptionSelected = selected.includes(option);
            const updated = isOptionSelected
                ? selected.filter((item) => item !== option)
                : [...selected, option];

            return updated;
        });
    }, [updateAnswer]);

    const isFormCompleted: boolean = useMemo(() =>
        questions.every((q) => {
            const answer = answers[q.id];
            if (q.answerFormat === 'checkbox') return Array.isArray(answer) && answer.length > 0;
            return answer !== undefined && answer !== '';
        }), [answers, questions]);

    return {
        answers,
        questions,
        questionnaireTitle,
        handleAnswer,
        toggleCheckboxAnswer,
        isFormCompleted
    };
}; 