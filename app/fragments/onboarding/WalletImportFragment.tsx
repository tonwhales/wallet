import * as React from 'react';
import { Text, View } from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { iOSColors, iOSUIKit } from "react-native-typography";
import { fragment } from "../../fragment";
import { mnemonicNew, mnemonicToWalletKey } from "ton-crypto";

const WordInput = React.memo((props: { hint: string }) => {
    return (
        <View
            style={{
                marginVertical: 8,
                backgroundColor: iOSColors.customGray,
                height: 50,
                width: 300,
                borderRadius: 25,
                flexDirection: 'row'
            }}
        >
            <Text style={{ alignSelf: 'center', fontSize: 18, width: 40, textAlign: 'right' }}>{props.hint}.</Text>
            <TextInput
                style={{
                    height: 50,
                    marginLeft: -20,
                    paddingLeft: 26,
                    paddingRight: 48,
                    flexGrow: 1,
                    fontSize: 18
                }}
                returnKeyType="next"
                autoCompleteType="off"
                autoCorrect={false}
                keyboardType="ascii-capable"
                autoCapitalize="none"
                inputAccessoryViewID="autocomplete"
            />
        </View>
    )
});

export const WalletImportFragment = fragment(() => {

    (async () => {
        let res = await mnemonicNew();
        let key = await mnemonicToWalletKey(res);
        console.warn(res);
        console.warn(key);
    })()
    return (
        <ScrollView style={{ flexGrow: 1, backgroundColor: 'white' }} contentContainerStyle={{ alignItems: 'center' }}>
            <Text style={[iOSUIKit.largeTitleEmphasized, { alignSelf: 'center', marginTop: 16, marginHorizontal: 16 }]}>24 Secret Words</Text>
            <Text style={[iOSUIKit.body, { alignSelf: 'center', textAlign: 'center', marginTop: 16, marginHorizontal: 16, marginBottom: 16 }]}>Please restore access to your wallet by entering the 24 secret words you wrote down when creating the wallet.</Text>
            <WordInput hint="1" />
            <WordInput hint="2" />
            <WordInput hint="3" />
            <WordInput hint="4" />
            <WordInput hint="5" />
            <WordInput hint="6" />
            <WordInput hint="7" />
            <WordInput hint="8" />
            <WordInput hint="9" />
            <WordInput hint="10" />
            <WordInput hint="11" />
            <WordInput hint="12" />
            <WordInput hint="13" />
            <WordInput hint="14" />
            <WordInput hint="15" />
            <WordInput hint="16" />
            <WordInput hint="17" />
            <WordInput hint="18" />
            <WordInput hint="19" />
            <WordInput hint="20" />
            <WordInput hint="21" />
            <WordInput hint="22" />
            <WordInput hint="23" />
            <WordInput hint="24" />
        </ScrollView>
    );
});