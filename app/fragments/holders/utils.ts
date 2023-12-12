import { warn } from "../../utils/log";
import { BackPolicy, HoldersQueryParams } from "./types";
import { Dispatch } from "react";

export type HoldersParams = {
    closeApp?: boolean,
    openUrl?: string | null,
    backPolicy: BackPolicy,
    openEnrollment?: boolean,
    showKeyboardAccessoryView?: boolean,
    lockScroll?: boolean,
}

export function extractHoldersQueryParams(url: string): HoldersParams {
    try {
        const query = url.split('?')[1];
        const params = new URLSearchParams(query);
        let closeApp = false;
        let openUrl = null;
        let backPolicy: BackPolicy = 'close';
        let openEnrollment = false;
        let showKeyboardAccessoryView = false;
        let lockScroll = undefined;

        if (params.has(HoldersQueryParams.CloseApp)) {
            const queryValue = params.get(HoldersQueryParams.CloseApp);
            if (queryValue === 'true') {
                closeApp = true;
            }
        }

        if (params.has(HoldersQueryParams.OpenUrl)) {
            const queryValue = params.get(HoldersQueryParams.OpenUrl);
            if (queryValue) {
                openUrl = queryValue;
            }
        }

        if (params.has(HoldersQueryParams.BackPolicy)) {
            const queryValue = params.get(HoldersQueryParams.BackPolicy);
            if (queryValue === 'back') {
                backPolicy = 'back';
            }
        }

        if (params.has(HoldersQueryParams.OpenEnrollment)) {
            const queryValue = params.get(HoldersQueryParams.OpenEnrollment);
            if (queryValue === 'true') {
                openEnrollment = true;
            }
        }

        if (params.has(HoldersQueryParams.ShowKeyboardAccessoryView)) {
            const queryValue = params.get(HoldersQueryParams.ShowKeyboardAccessoryView);
            if (queryValue === 'true') {
                showKeyboardAccessoryView = true;
            }
        }

        if (params.has(HoldersQueryParams.LockScroll)) {
            const queryValue = params.get(HoldersQueryParams.LockScroll);
            if (queryValue === 'false') {
                lockScroll = false;
            } else if (queryValue === 'true') {
                lockScroll = true;
            }
        }

        return {
            closeApp,
            openUrl,
            backPolicy,
            openEnrollment,
            showKeyboardAccessoryView,
            lockScroll
        }
    } catch (error) {
        warn(error);
        return { backPolicy: 'close' }
    }
}

export type HeaderAction = { type: 'setColor', args: { color: string | null } } | { type: 'setPrevColor' } | { type: 'reset' }
export type HeaderState = { newColor: string| null, prevColor: string | null }

export function reduceHeader() {
    return (state: HeaderState, action: HeaderAction) => {
        switch (action.type) {
            case 'setColor':
                return {
                    prevColor: state.prevColor,
                    newColor: action.args.color
                }
            case 'setPrevColor':
                return {
                    prevColor: state.newColor,
                    newColor: state.newColor
                }
            case 'reset':
                return {
                    prevColor: null,
                    newColor: null
                }
            default:
                return state;
        }
    }
}

export function processHeaderMessage(
    parsed: any,
    dispatchHeader: Dispatch<HeaderAction>
) {
    if (typeof parsed.data.name === 'string' && (parsed.data.name as string).indexOf('main-header') !== -1) {
        const actionType = parsed.data.name.split('.')[1];

        switch (actionType) {
            case 'setColor':
                dispatchHeader({ type: 'setColor', args: { color: parsed.data.args.color } });
                break;
            default:
                warn('Invalid main button action type');
        }
        return true;
    }
    return false;
}