import React from "react";
import { PasscodeComponent } from "../../components/Passcode/PasscodeComponent";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";

export const SetPasscodeFragment = fragment(() => {
    const params = useParams<{
        onSuccess?: () => void,
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