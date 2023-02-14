import React, { useMemo } from 'react';
import { TouchableHighlight, View, Text } from 'react-native';
import { t } from '../../i18n/t';
import { Theme } from '../../Theme';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { PriceComponent } from '../PriceComponent';
import { ValueComponent } from '../ValueComponent';
import ProtectedIcon from '../../../assets/ic_sign_lock.svg';
import BN from 'bn.js';

// { lockup }: { lockup: { metadata: Lockup, address: Address } }
// const balance = useMemo(() => {
//     let temp = new BN(0);
//     if (lockup.metadata.totalLockedValue) {
//         temp = temp.add(lockup.metadata.totalLockedValue);
//     }
//     if (lockup.metadata.totalRestrictedValue) {
//         temp = temp.add(lockup.metadata.totalRestrictedValue);
//     }
//     return temp;
// }, [lockup]);

export const LockupProductComponent = React.memo(({ balance }: { balance: BN }) => {
    const navigation = useTypedNavigation();

    return (
        <TouchableHighlight
            onPress={() => navigation.navigate('Lockups')}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: Theme.item,
                marginHorizontal: 16, marginVertical: 4
            }}
        >
            <View style={{
                padding: 10
            }}>
                <View style={{ alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginRight: 10 }}>
                        <View style={{ backgroundColor: Theme.accent, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <ProtectedIcon width={24} height={24} color={'white'} fill={'white'} />
                        </View>
                    </View>
                    <View style={{
                        flexDirection: 'column',
                        flexGrow: 1,
                        paddingVertical: 2,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 3
                        }}>
                            <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>
                                {t('products.lockups.title')}
                            </Text>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: '#4FAE42'
                            }}>
                                <ValueComponent
                                    value={balance}
                                    precision={3}
                                />
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}>
                            <Text style={{ color: '#787F83', fontSize: 13, fontWeight: '400' }} ellipsizeMode="tail">
                                {"Description here"}
                            </Text>
                            <PriceComponent
                                amount={balance}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    marginTop: 2, height: undefined,
                                    minHeight: 14
                                }}
                                textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    );
});