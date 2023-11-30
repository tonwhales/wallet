import { Address } from "@ton/core";
import { memo } from "react";
import { Pressable } from "react-native";
import { ThemeType } from "../../../../engine/state/theme";
import { t } from "../../../../i18n/t";
import { PerfText } from "../../../../components/basic/PerfText";
import { Typography } from "../../../../components/styles";
import { PerfView } from "../../../../components/basic/PerfView";
import { AddressComponent } from "../../../../components/address/AddressComponent";

type PreviewToProps = {
    to: {
        address: Address | null;
        name: string;
    } | {
        address: Address;
        name: string | undefined;
    }
    kind: 'in' | 'out';
    theme: ThemeType;
    isTestnet: boolean;
    onCopyAddress: (address: Address) => void;
}

export const PreviewTo = memo((props: PreviewToProps) => {
    const { to, kind, theme, isTestnet, onCopyAddress } = props

    if (!to.address) return null

    return (
        <Pressable
            onPress={() => onCopyAddress(to.address!)}
            style={({ pressed }) => ({ paddingHorizontal: 10, justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}
        >
            <PerfText style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                {t('common.to')}
            </PerfText>
            <PerfView style={{ flexDirection: 'row', alignItems: 'center' }}>
                {to.name && kind === 'in' && (
                    <PerfText
                        style={[{ color: theme.textPrimary, flexShrink: 1, marginRight: 6 }, Typography.regular17_24]}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {to.name}
                    </PerfText>
                )}
                <PerfText style={[{ color: theme.textSecondary }, Typography.regular17_24]}>
                    {kind === 'in' ? (
                        <AddressComponent
                            address={to.address}
                            end={4}
                        />
                    ) : (
                        <PerfText style={{ color: theme.textPrimary }}>
                            {to.address.toString({ testOnly: isTestnet }).replaceAll('-', '\u2011')}
                        </PerfText>
                    )}
                </PerfText>
            </PerfView>
        </Pressable>
    )
});
PreviewTo.displayName = 'PreviewTo';