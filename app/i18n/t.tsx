import * as React from 'react';
import { LocalizedResources, LocalizedPluralsResources } from './schema';
import i18n from 'i18next';
import { Trans } from 'react-i18next';
import { Text } from 'react-native';

const strong = <Text style={{ fontWeight: '600' }} />;

export function t(source: LocalizedResources, options?: any): string {
    return i18n.t(source, options);
}

export function tStyled(source: LocalizedResources, options?: any): any {
    return (
        <Trans
            i18nKey={source as any}
            t={t}
            values={options}
            components={{ strong }}
        />
    )
}

export function p(source: LocalizedPluralsResources, count: number, options?: any): string {
    return i18n.t(source, { ...options, count });
}

export function pStyled(source: LocalizedPluralsResources, count: number, options?: any): any {
    return (
        <Trans
            i18nKey={source}
            t={t}
            values={{ ...options, count }}
            components={{ strong }}
        />
    )
}