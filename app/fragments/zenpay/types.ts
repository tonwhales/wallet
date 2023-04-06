export enum ZenPayQueryParams {
    LockScroll = 'lockScroll',
    CloseApp = 'closeApp',
    OpenEnrollment = 'openEnrollment',
    BackPolicy = 'backPolicy',
    OpenUrl = 'openUrl',
}

export type BackPolicy = 'back' | 'close' | 'lock';