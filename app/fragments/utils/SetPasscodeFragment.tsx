import React from "react";
import { PasscodeComponent } from "../../components/Security/PasscodeComponent";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";

export const SetPasscodeFragment = fragment(() => {
    const params = useParams<{
        onSuccess?: () => void,
        onCancel?: () => void,
    }>();

    return (
        <PasscodeComponent
            type={'new'}
            onSuccess={params.onSuccess}
            onCancel={params.onCancel}
        />
    );
});