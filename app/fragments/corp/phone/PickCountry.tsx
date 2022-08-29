import * as React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ATextInput } from '../../../components/ATextInput';
import { Deferred } from '../../../components/Deferred';
import { ItemButton } from '../../../components/ItemButton';
import { ItemHeader } from '../../../components/ItemHeader';
// import { useKeyboard } from '../../utils/useKeyboard';
import { Theme } from '../../../Theme';
import { t } from '../../../i18n/t';
import { countries } from '../../../utils/countries';
import { Country } from '../../../utils/Country';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { fragment } from '../../../fragment';
import { useRoute } from '@react-navigation/native';

const preprocessed: { title: string, countries: Country[] }[] = [];
let lastPrefix: string | undefined = undefined;
for (let c of countries) {
    let prefix = c.label[0];
    if (lastPrefix !== prefix) {
        lastPrefix = prefix;
        preprocessed.push({ title: prefix, countries: [c] });
    } else {
        preprocessed[preprocessed.length - 1].countries.push(c);
    }
}

const DefaultList = React.memo((props: { onPicked: (country: Country) => void }) => {
    return (
        <ScrollView style={{ paddingTop: 16 }} keyboardShouldPersistTaps="always">
            {preprocessed.map((g, i) => (
                <View key={'prefix-' + i}>
                    <ItemHeader title={g.title} />
                    {g.countries.map((c, i2) => (
                        <ItemButton key={'country-' + i2} title={`${c.label}`} hint={c.value + ' ' + c.emoji} onPress={() => props.onPicked(c)} />
                    ))}
                </View>
            ))}
        </ScrollView>
    );
});

export const PickCountry = fragment(() => {
    const safeArea = useSafeAreaInsets();
    // const keyboard = useKeyboard();
    const navigation = useTypedNavigation();
    const route = useRoute();
    let params = route.params as { onPicked?: (country: Country) => void };
    const hide = React.useCallback(() => {
        Keyboard.dismiss();
        navigation.goBack();
    }, []);
    const onPicked = React.useCallback((country: Country) => {
        if (params.onPicked) {
            params.onPicked(country);
        }
        hide();
    }, [params.onPicked]);
    const [search, setSearch] = React.useState('');
    const found = React.useMemo(() => {
        let query = search.trim().toLocaleLowerCase();
        if (query.length === 0) {
            return null;
        }
        const res: Country[] = [];
        for (let c of countries) {
            if (c.label.toLocaleLowerCase().startsWith(query) || c.value.startsWith(query) || c.value.startsWith('+' + query)) {
                res.push(c);
            }
        }
        return res;
    }, [search]);


    return (
        <KeyboardAvoidingView style={{ flexGrow: 1, flexBasis: 0 }}>
            <View style={{ paddingTop: Platform.OS === 'ios' ? 12 : 0, paddingBottom: 4, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                <ATextInput placeholder={t('common.search')} value={search} onValueChange={setSearch} style={{ flexGrow: 1 }} autoFocus={Platform.OS === 'ios'} />
            </View>
            <View style={{ flexGrow: 1, flexBasis: 0, position: 'relative' }}>
                <Deferred>
                    <DefaultList onPicked={onPicked} />
                    {found !== null && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Theme.background }}>
                            <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }} keyboardShouldPersistTaps="always">
                                {found.map((c, i) => (
                                    <ItemButton key={'country-' + i} title={`${c.label}`} hint={c.value + ' ' + c.emoji} onPress={() => onPicked(c)} />
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </Deferred>
            </View>
        </KeyboardAvoidingView>
    );
});