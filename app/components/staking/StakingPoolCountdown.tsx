import { memo, useEffect, useState } from "react";
import { Countdown } from "../Countdown";
import { Typography } from "../styles";
import { ThemeType } from "../../engine/state/theme";

export const StakingPoolCountdown = memo(({ stakeUntil, theme }: { stakeUntil: number, theme: ThemeType }) => {
    const [left, setLeft] = useState(Math.floor(stakeUntil - (Date.now() / 1000)));

    useEffect(() => {
        const timerId = setInterval(() => {
            setLeft(Math.floor((stakeUntil) - (Date.now() / 1000)));
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [stakeUntil]);

    return (
        <Countdown
            hidePrefix
            left={left}
            textStyle={[{ color: theme.textPrimary, flex: 1, flexShrink: 1 }, Typography.regular13_18]}
        />
    );
});