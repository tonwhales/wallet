import React, { } from "react"
import { PasscodeChange } from "./PasscodeChange";
import { PasscodeConfirm } from "./PasscodeConfirm";

export const PasscodeComponent = React.memo((props: {
    type?: 'confirm' | 'new' | 'change',
    onSuccess?: (passcode: string) => void,
    onCancel?: () => void,
    backgroundColor?: string
}) => {
    switch (props.type) {
        case 'change': {
            return (
                <PasscodeChange
                    backgroundColor={props.backgroundColor}
                    onSuccess={props.onSuccess}
                    onCancel={props.onCancel}
                />
            );
        }
        case 'new': {
            return (
                <PasscodeChange
                    new
                    onSuccess={props.onSuccess}
                    onCancel={props.onCancel}
                    backgroundColor={props.backgroundColor}
                />
            );
        }
        case 'confirm': {
            return (
                <PasscodeConfirm
                    onSuccess={props.onSuccess}
                    onCancel={props.onCancel}
                    backgroundColor={props.backgroundColor}
                />
            );
        }
        default: {
            return null;
        }
    }
});
