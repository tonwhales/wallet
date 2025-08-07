import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';

type UseCountdownT = {
    timer: {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    };
    isComplete: boolean;
    reset: () => void;
};

const calculateTimeLeft = (targetDate: string): UseCountdownT => {
    const now = dayjs();
    const target = dayjs(targetDate);
    const diff = target.diff(now);

    if (diff <= 0) {
        return {
            timer: {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0
            },
            isComplete: true,
            reset: () => { }
        };
    }

    return {
        timer: {
            days: target.diff(now, 'day'),
            hours: target.diff(now, 'hour') % 24,
            minutes: target.diff(now, 'minute') % 60,
            seconds: target.diff(now, 'second') % 60
        },
        isComplete: false,
        reset: () => { }
    };
};

type TargetDate = (() => string) | string;

type UseCountdownParams = {
    enabled?: boolean;
    onComplete?(): void;
};

const getTargetDateValue = (targetDate: TargetDate) =>
    targetDate && typeof targetDate === 'function' ? targetDate() : targetDate;

export function useCountdown(
    initialTargetDate: TargetDate,
    params?: UseCountdownParams
): UseCountdownT {
    const { enabled, onComplete } = { enabled: true, ...params };

    const [targetDate, setTargetDate] = useState<string>(
        getTargetDateValue(initialTargetDate)
    );

    const [timeLeft, setTimeLeft] = useState<UseCountdownT>(() =>
        calculateTimeLeft(targetDate)
    );

    useEffect(() => {
        if (timeLeft.isComplete || !enabled) {
            if (timeLeft.isComplete) {
                onComplete?.();
            }

            return;
        }

        const interval = setInterval(() => {
            const updatedTimeLeft = calculateTimeLeft(targetDate);
            setTimeLeft(updatedTimeLeft);

            if (updatedTimeLeft.isComplete) {
                clearInterval(interval);

                onComplete?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate, timeLeft.isComplete, onComplete, enabled]);

    const reset = useCallback(() => {
        const newTargetDate = getTargetDateValue(initialTargetDate);

        setTargetDate(newTargetDate);
        setTimeLeft(calculateTimeLeft(newTargetDate));
    }, [initialTargetDate]);

    return { ...timeLeft, reset };
}
