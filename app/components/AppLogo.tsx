import * as React from 'react';
import { Image } from 'react-native';

export function AppLogo() {
    return <Image source={require('../../assets/logo.png')} style={{ width: 250, height: 250 }} resizeMode="cover" />
}