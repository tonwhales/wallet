import React, { memo } from 'react';
import { View } from 'react-native';
import { ReAnimatedCircularProgress } from '../CircularProgress/ReAnimatedCircularProgress';
import { ThemeType } from '../../engine/state/theme';

type TransactionsListFooterProps = {
    hasNext: boolean;
    theme: ThemeType;
};

/**
 * Footer component for transaction list with loading indicator
 */
export const TransactionsListFooter = memo(({ hasNext, theme }: TransactionsListFooterProps) => {
    if (!hasNext) {
        return null;
    }

    return (
        <View style={{ 
            height: 64, 
            justifyContent: 'center', 
            alignItems: 'center', 
            width: '100%' 
        }}>
            <ReAnimatedCircularProgress
                size={24}
                color={theme.iconPrimary}
                reverse
                infinitRotate
                progress={0.8}
            />
        </View>
    );
});

TransactionsListFooter.displayName = 'TransactionsListFooter';

