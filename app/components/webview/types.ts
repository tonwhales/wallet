export enum QueryAPI {
    LockScroll = 'lockScroll',
    CloseApp = 'closeApp',
    OpenEnrollment = 'openEnrollment',
    BackPolicy = 'backPolicy',
    OpenUrl = 'openUrl',
    ShowKeyboardAccessoryView = 'showKAV',
    MarkAsShown = 'markAsShown',
    Subscribed = 'subscribed',
}

export type BackPolicy = 'back' | 'close' | 'lock';