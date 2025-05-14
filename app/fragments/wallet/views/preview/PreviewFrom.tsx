import { memo } from "react"
import { Pressable } from "react-native"
import { PerfText } from "../../../../components/basic/PerfText"
import { PerfView } from "../../../../components/basic/PerfView"
import { Address } from "@ton/core"
import { t } from "../../../../i18n/t"
import { ThemeType } from "../../../../engine/state/theme"
import { AddressComponent } from "../../../../components/address/AddressComponent"
import { Typography } from "../../../../components/styles"
import { KnownWallets } from "../../../../secure/KnownWallets"

type PreviewFromProps = {
    from: {
        address: string | null;
        name: string;
    } | {
        address: string;
        name: string | undefined;
    }
    kind: 'in' | 'out';
    theme: ThemeType;
    isTestnet: boolean;
    onCopyAddress: (address: string) => void;
    bounceableFormat?: boolean;
}

export const PreviewFrom = memo((props: PreviewFromProps) => {
    const { from, kind, theme, isTestnet, onCopyAddress, bounceableFormat } = props;

    if (!from.address) return null;

    const parsedAddress = Address.parseFriendly(from.address);
    const known = KnownWallets(isTestnet)[parsedAddress.address.toString({ testOnly: isTestnet })];
    const bounceable = bounceableFormat !== undefined ? bounceableFormat : parsedAddress.isBounceable;
    const parsedAddressFriendly = parsedAddress.address.toString({ testOnly: isTestnet, bounceable });

    return (
        <Pressable
            onPress={() => onCopyAddress(parsedAddressFriendly)}
            style={({ pressed }) => ({ paddingHorizontal: 10, justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}
        >
            <PerfText style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                {t('common.from')}
            </PerfText>
            <PerfView style={{ alignItems: 'center', flexDirection: 'row', }}>
                <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                    {kind === 'in' ? (
                        <PerfText>
                            {parsedAddressFriendly.replaceAll('-', '\u2011')}
                        </PerfText>
                    ) : (
                        <>
                            {!!from.name && (
                                <PerfText
                                    style={[{ color: theme.textPrimary, flexShrink: 1 }, Typography.regular17_24]}
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                >
                                    {from.name + ' '}
                                </PerfText>
                            )}
                            <PerfText style={{ color: !!from.name ? theme.textSecondary : theme.textPrimary, }}>
                                <AddressComponent
                                    address={parsedAddress.address}
                                    bounceable={parsedAddress.isBounceable}
                                    end={4}
                                    known={!!known}
                                    testOnly={isTestnet}
                                />
                            </PerfText>
                        </>
                    )}
                </PerfText>
            </PerfView>
        </Pressable>
    );
});
PreviewFrom.displayName = 'PreviewFrom'