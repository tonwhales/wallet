// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { t } from '../../../i18n/t';
// import { CodeFragment } from './CodeFragment';
// import { PhoneFragment } from './PhoneScreen';
// import { PickCountry } from './PickCountry';

// const Stack = createNativeStackNavigator();

// export function PhoneVerificationStack() {
//     return (
//         <Stack.Navigator screenOptions={{ headerBackTitle: t('common.back'), headerShadowVisible: false, headerShown: false }}>
//             <Stack.Screen
//                 name="Phone"
//                 component={PhoneFragment}
//             />
//             <Stack.Screen
//                 name="Code"
//                 component={CodeFragment}
//                 options={{ title: '', statusBarStyle: 'dark', headerShown: true }}
//             />
//             <Stack.Screen
//                 name="Country"
//                 component={PickCountry}
//                 options={{ title: '', statusBarStyle: 'dark', headerShown: false, presentation: 'modal' }}
//             />
//         </Stack.Navigator>
//     );
// }