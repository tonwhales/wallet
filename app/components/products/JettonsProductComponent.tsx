import React, { memo, useCallback } from "react";
import { View } from "react-native";
import { JettonProductItem } from "./JettonProductItem";
import { useMarkJettonDisabled } from "../../engine/hooks/jettons/useMarkJettonDisabled";
import { useCloudValue, useDisplayableJettons, useExtraCurrencyHints, useNetwork, useTheme } from "../../engine/hooks";
import { CollapsibleCards } from "../animated/CollapsibleCards";
import { PerfText } from "../basic/PerfText";
import { t } from "../../i18n/t";
import { Typography } from "../styles";
import { Address } from "@ton/core";
import { Image } from "expo-image";
import { AssetViewType } from "../../fragments/wallet/AssetsFragment";
import { JettonFull } from "../../engine/api/fetchHintsFull";
import { ExtraCurrencyHint } from "../../engine/api/fetchExtraCurrencyHints";
import { ExtraCurrencyProductItem } from "./ExtraCurrencyProductItem";

const hideIcon = <Image source={require('@assets/ic-hide.png')} style={{ width: 36, height: 36 }} />;

type JettonsProductItem = (JettonFull & { type: 'jetton' }) | (ExtraCurrencyHint & { type: 'extra' });

export const JettonsProductComponent = memo(({ owner }: { owner: Address }) => {
    const theme = useTheme();
    const { isTestnet: testOnly } = useNetwork();
    const markJettonDisabled = useMarkJettonDisabled();
    const hints = useDisplayableJettons(owner.toString({ testOnly })).jettonsList;
    const extraCurrencies = useExtraCurrencyHints(owner.toString({ testOnly })).data ?? [];
    const [disabledState] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });

    const renderFace = useCallback(() => {
        return (
            <View style={[
                {
                    flexGrow: 1, flexDirection: 'row',
                    padding: 20,
                    marginHorizontal: 16,
                    borderRadius: 20,
                    alignItems: 'center',
                    backgroundColor: theme.surfaceOnBg,
                },
                theme.style === 'dark' ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                } : {}
            ]}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                    <Image
                        source={require('@assets/ic-coins.png')}
                        style={{ width: 46, height: 46, borderRadius: 23 }}
                    />
                </View>
                <View style={{ marginLeft: 12, flexShrink: 1 }}>
                    <PerfText
                        style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {t('jetton.productButtonTitle')}
                    </PerfText>
                    <PerfText
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[{ flexShrink: 1, color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        <PerfText style={{ flexShrink: 1 }}>
                            {t('common.showMore')}
                        </PerfText>
                    </PerfText>
                </View>
            </View>
        );
    }, [theme.surfaceOnBg, theme.textPrimary, theme.textSecondary, theme.style]);

    const visibleList: (JettonFull & { type: 'jetton' })[] = hints
        .filter((s) => !disabledState.disabled[s.jetton.address])
        .filter((s) => !!s)
        .map((s) => ({ ...s, type: 'jetton' }));
    const extraList: (ExtraCurrencyHint & { type: 'extra' })[] = extraCurrencies
        .filter((s) => !!s)
        .map((s) => ({ ...s, type: 'extra' }));

    const items = [...extraList, ...visibleList];

    const renderItem = useCallback((item: JettonsProductItem) => {
        if (!item) {
            return null;
        }
        if (item.type === 'jetton') {
            return (
                <JettonProductItem
                    key={'jt' + item.jetton.address}
                    hint={item}
                    rightAction={() => markJettonDisabled(item.jetton.address)}
                    rightActionIcon={hideIcon}
                    card
                    owner={owner}
                    jettonViewType={AssetViewType.Default}
                />
            );
        }

        return (
            <ExtraCurrencyProductItem
                key={'ex' + item.preview.id}
                currency={item}
                card
                owner={owner}
                jettonViewType={AssetViewType.Default}
            />
        );
    }, [hideIcon, owner, markJettonDisabled]);

    if (items.length === 0) {
        return null;
    }

    return (
        <View style={{ marginBottom: 16 }}>
            <CollapsibleCards
                title={t('jetton.productButtonTitle')}
                items={items}
                renderItem={renderItem}
                renderFace={renderFace}
                itemHeight={86}
                theme={theme}
                limitConfig={{
                    maxItems: 10,
                    fullList: { type: 'jettons' }
                }}
            />
        </View>
    );
});
JettonsProductComponent.displayName = 'JettonsProductComponent';