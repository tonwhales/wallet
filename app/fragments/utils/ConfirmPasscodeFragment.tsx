import React from "react";
import { PasscodeComponent } from "../../components/Passcode/PasscodeComponent";
import { systemFragment } from "../../systemFragment";
import { useParams } from "../../utils/useParams";

export const ConfirmPasscodeFragment = systemFragment(() => {
    const params = useParams<{
        onSuccess?: (passcode: string) => void,
        onCancel?: () => void,
        onSkip?: () => void,
    }>();

    return (
        <PasscodeComponent
            type={'new'}
            onSuccess={params.onSuccess}
        />
    );
});