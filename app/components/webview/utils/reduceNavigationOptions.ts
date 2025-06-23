import { BackPolicy } from "../types";

export type WebViewNavigationOptions = {
    backPolicy: BackPolicy,
    showKAV?: boolean,
    lockScroll?: boolean
}

export enum SetNavigationOptionsAction {
    setBackPolicy = 'setBackPolicy',
    setShowKeyboardAccessoryView = 'setShowKeyboardAccessoryView',
    setLockScroll = 'setLockScroll'
}

export type NavigationOptionsAction = {
    type: SetNavigationOptionsAction.setBackPolicy,
    backPolicy: BackPolicy
} | {
    type: SetNavigationOptionsAction.setShowKeyboardAccessoryView,
    showKAV: boolean
} | {
    type: SetNavigationOptionsAction.setLockScroll,
    lockScroll: boolean
}

export function reduceNavigationOptions() {
    return (navigationOptions: WebViewNavigationOptions, action: NavigationOptionsAction) => {
        switch (action.type) {
            case SetNavigationOptionsAction.setBackPolicy:
                return {
                    ...navigationOptions,
                    backPolicy: action.backPolicy
                }
            case SetNavigationOptionsAction.setShowKeyboardAccessoryView:
                return {
                    ...navigationOptions,
                    showKAV: action.showKAV
                }
            case SetNavigationOptionsAction.setLockScroll:
                return {
                    ...navigationOptions,
                    lockScroll: action.lockScroll
                }
            default:
                return navigationOptions
        }
    }
}
