import React, { } from "react"
import { PasscodeChange } from "./PasscodeChange";
import { PasscodeConfirm } from "./PasscodeConfirm";

export const PasscodeComponent = React.memo((props: {
    type?: 'confirm' | 'new' | 'change',
    onSuccess?: () => void,
    onCancel?: () => void
}) => {
    console.log({ props })
    switch (props.type) {
        case 'change': {
            return (<PasscodeChange onSuccess={props.onSuccess} onCancel={props.onCancel} />);
        }
        case 'new': {
            return (<PasscodeChange new onSuccess={props.onSuccess} onCancel={props.onCancel} />);
        }
        case 'confirm': {
            return (<PasscodeConfirm onSuccess={props.onSuccess} onCancel={props.onCancel} />);
        }
        default: {
            return null;
        }
    }
});
