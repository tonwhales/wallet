import * as React from 'react';
import { Text, View } from 'react-native';
import { Address } from 'ton';
import { AppConfig } from '../../AppConfig';
import { AddressComponent } from '../../components/AddressComponent';
import { Avatar } from '../../components/Avatar';
import { ItemButton } from '../../components/ItemButton';
import { t } from '../../i18n/t';
import { Theme } from '../../Theme';

export const ProfileComponent = React.memo((props: { address: Address }) => {
    return (
        <View style={{
            marginBottom: 16,
            marginTop: 16,
            backgroundColor: Theme.item,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 16, width: '100%', flexDirection: 'row' }}>
                <Avatar size={64} id={props.address.toFriendly({ testOnly: AppConfig.isTestnet })} />
                <View style={{ paddingLeft: 16, alignSelf: 'stretch', justifyContent: 'center' }}>
                    <Text style={{ color: Theme.textColor, fontSize: 18 }}>No name</Text>
                    <Text style={{ color: Theme.textColor, fontSize: 16, paddingTop: 4 }}><AddressComponent address={props.address} /></Text>
                </View>
            </View>
            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
            <View style={{ marginHorizontal: 16, width: '100%', paddingLeft: 16 }}>
                <ItemButton title={'Complete your profile'} onPress={() => { }} />
            </View>
        </View>
    );
});