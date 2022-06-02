import * as React from 'react';
import { View } from 'react-native';
import { Item } from '../../components/Item';
import { fragment } from '../../fragment';
import { getApplicationKey, loadKeyStorageRef, loadKeyStorageType } from '../../storage/secureStorage';
import { Theme } from '../../Theme';

export const DevStorageFragment = fragment(() => {
    let [value, setValue] = React.useState('');
    React.useEffect(() => {
        (async () => {
            try {
                await getApplicationKey();
                setValue('ok');
            } catch (e) {
                console.warn(e);
                setValue('error');
            }
        })();
    }, []);
    let ref = loadKeyStorageRef();
    let kind = loadKeyStorageType();

    return (
        <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, paddingHorizontal: 16 }}>
            <View style={{
                marginBottom: 16, marginTop: 17,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={"Storage Kind"} hint={kind} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={"Storage Ref"} hint={ref} />
                </View>
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <Item title={"Storage Key"} hint={value} />
                </View>
            </View>
        </View>
    );
});