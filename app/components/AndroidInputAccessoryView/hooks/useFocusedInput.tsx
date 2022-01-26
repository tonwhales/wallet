import React from "react"
import { View } from "react-native";

type Input = {
    value: string | undefined,
    onSetValue: (input: string) => void
} | undefined

const FocusedInputContext = React.createContext<{
    current: Input | undefined,
    setCurrent: (val: Input) => void | undefined
}>({
    current: undefined,
    setCurrent: () => {}
});

export const FocusedInputLoader = React.memo((props: { children: any }) => {
    const [current, setCurrent] = React.useState<{
        value: string | undefined,
        onSetValue: (input: string) => void
    } | undefined>(undefined);

    return (
        <FocusedInputContext.Provider value={{
            current: current,
            setCurrent: setCurrent
        }}>
            {props.children}
        </FocusedInputContext.Provider>
    );
});

export function useFocusedInput(): {
    current: Input | undefined,
    setCurrent: (val: Input) => void | undefined
} {
    let focusedInput = React.useContext(FocusedInputContext);
    return focusedInput;
}