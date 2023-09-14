import BN from 'bn.js';
import * as React from 'react';
import { Image, NativeSyntheticEvent, Platform, Share, Text, ToastAndroid, useWindowDimensions, View } from 'react-native';
import { Address, RawTransaction } from 'ton';
import { ValueComponent } from '../../../components/ValueComponent';
import { formatTime } from '../../../utils/dates';
import { AddressComponent } from '../../../components/AddressComponent';
import { TouchableHighlight } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { PendingTransactionAvatar } from '../../../components/PendingTransactionAvatar';
import { KnownJettonMasters, KnownWallet, KnownWallets } from '../../../secure/KnownWallets';
import { shortAddress } from '../../../utils/shortAddress';
import { t } from '../../../i18n/t';
import ContextMenu, { ContextMenuAction, ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { confirmAlert } from '../../../utils/confirmAlert';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { useTheme } from '../../../engine/hooks/useTheme';
import { useNetwork } from '../../../engine/hooks/useNetwork';
import { useTransaction } from '../../../engine/hooks/useTransaction';
import { useSpamMinAmount } from '../../../engine/hooks/useSpamMinAmount';
import { useContactAddress } from '../../../engine/hooks/useContactAddress';
import { useDenyAddress } from '../../../engine/hooks/useDenyAddress';
import { useIsSpamWallet } from '../../../engine/hooks/useIsSpamWallet';
import { TransactionDescription } from '../../../engine/hooks/useAccountTransactions';
import { ThemeType } from '../../../engine/state/theme';

function knownAddressLabel(wallet: KnownWallet, isTestnet: boolean, friendly?: string) {
    return wallet.name + ` (${shortAddress({ friendly, isTestnet })})`
}

export const TransactionView = React.memo((props: {
    own: Address,
    tx: TransactionDescription,
    separator: boolean,
    theme: ThemeType,
    fontScaleNormal: boolean,
    onPress: (src: TransactionDescription) => void
}) => {
    const theme = props.theme;
    const fontScaleNormal = props.fontScaleNormal;

    return (
        <TouchableHighlight
            underlayColor={theme.selector}
            style={{ backgroundColor: theme.item, minHeight: 62, maxHeight: 62 }}
            onLongPress={() => { }} /* Adding for Android not calling onPress while ContextMenu is LongPressed */
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: fontScaleNormal ? 62 : undefined, minHeight: fontScaleNormal ? undefined : 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    {props.tx.base.status !== 'pending' && (
                        <Avatar
                            address={'EQA-daKmzkx5nLMKT465D_-uyhwgBTEucMeyvfGLfzHoWspv'}
                            id={'EQA-daKmzkx5nLMKT465D_-uyhwgBTEucMeyvfGLfzHoWspv'}
                            size={42}
                            image={undefined}
                            spam={false}
                            markContact={false}
                            verified={false}
                        />
                    )}
                    {/* {parsed.status === 'pending' && (
                        <PendingTransactionAvatar address={friendlyAddress} avatarId={avatarId} />
                    )} */}
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexDirection: 'row', marginTop: 10, marginRight: 10 }}>
                        <View style={{
                            flexDirection: 'row',
                            flexGrow: 1, flexBasis: 0, marginRight: 16,
                        }}>
                            <Text
                                style={{ color: theme.textColor, fontSize: 16, fontWeight: '600', flexShrink: 1 }}
                                ellipsizeMode="tail"
                                numberOfLines={1}>
                                {t('tx.sent')}
                            </Text>
                            {/* {spam && (
                                <View style={{
                                    borderColor: theme.textSecondaryBorder,
                                    borderWidth: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRadius: 4,
                                    marginLeft: 6,
                                    paddingHorizontal: 4
                                }}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{'SPAM'}</Text>
                                </View>
                            )} */}
                        </View>
                        {/* {parsed.status === 'failed' ? (
                            <Text style={{ color: theme.failed, fontWeight: '600', fontSize: 16, marginRight: 2 }}>
                                {t('tx.failed')}
                            </Text>
                        ) : (
                            <Text
                                style={{
                                    color: item.amount.gte(new BN(0)) ? spam ? theme.textColor : theme.pricePositive : theme.priceNegative,
                                    fontWeight: '400',
                                    fontSize: 16,
                                    marginRight: 2,
                                }}>
                                <ValueComponent
                                    value={item.amount}
                                    decimals={item.kind === 'token' ? item.decimals : undefined}
                                />
                                {item.kind === 'token' ? ' ' + item.symbol : ''}
                            </Text>
                        )} */}
                        <Text
                            style={{
                                color: theme.pricePositive,
                                fontWeight: '400',
                                fontSize: 16,
                                marginRight: 2,
                            }}>
                            <ValueComponent
                                value={props.tx.base.amount}
                                decimals={undefined}
                            />
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10, marginBottom: fontScaleNormal ? undefined : 10 }}>
                        <Text
                            style={{ color: theme.textSecondary, fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            <AddressComponent address={props.tx.operation.address} />
                        </Text>
                        {/* {!!operation.comment ? <Image source={require('../../../../assets/comment.png')} style={{ marginRight: 4, transform: [{ translateY: 1.5 }] }} /> : null} */}
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>{formatTime(props.tx.base.time)}</Text>
                    </View>
                    <View style={{ flexGrow: 1 }} />
                    {props.separator && (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider }} />)}
                </View>
            </View>
        </TouchableHighlight>
    );
}, (prevProps, newProps) => newProps.tx.id !== prevProps.tx.id);

TransactionView.displayName = 'TransactionView';