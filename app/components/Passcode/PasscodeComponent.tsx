import React, { } from "react"
import { PasscodeChange } from "./PasscodeChange";
import { PasscodeConfirm } from "./PasscodeConfirm";

export type PasscodeAuthType = 'confirm' | 'new' | 'change';

export const PasscodeComponent = React.memo((
    {
        type,
        onSuccess,
        onCancel,
        backgroundColor,
    }: {
        type?: PasscodeAuthType,
        onSuccess?: (passcode: string) => void,
        onCancel?: () => void,
        backgroundColor?: string,
    }
) => {
    switch (type) {
        case 'change': {
            return (
                <PasscodeChange
                    backgroundColor={backgroundColor}
                    onSuccess={onSuccess}
                    onCancel={onCancel}
                />
            );
        }
        case 'new': {
            return (
                <PasscodeChange
                    new
                    onSuccess={onSuccess}
                    onCancel={onCancel}
                    backgroundColor={backgroundColor}
                />
            );
        }
        case 'confirm': {
            return (
                <PasscodeConfirm
                    onSuccess={onSuccess}
                    onCancel={onCancel}
                    backgroundColor={backgroundColor}
                />
            );
        }
        default: {
            return null;
        }
    }
});
