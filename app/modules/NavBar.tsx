import { NativeModules, Platform } from 'react-native';

const { NavBarColor } = NativeModules;

/**
 * **(Android Only)**
 * change BottomNavigationBar color
 * @param color dont use #fff format hex colors
 */
export function changeNavBarColor(
    color: string,
    light = false,
    animated = true,
) {
    if (Platform.OS === 'android') {
        const LightNav = light ? true : false;
        if (!NavBarColor.changeNavigationBarColor) {
            throw Error('NavBarColor unavalible');
        }
        NavBarColor.changeNavigationBarColor(color, LightNav, animated);
    }
};

/**
 * **(Android Only)**
 * hide BottomNavigationBar
 */
export function hideNavBar() {
    if (Platform.OS === 'android') {
        if (!NavBarColor.hideNavigationBar) {
            throw Error('NavBarColor unavalible');
        }
        return NavBarColor.hideNavigationBar();
    } else {
        return false;
    }
};

/**
 * **(Android Only)**
 * show BottomNavigationBar
 */
export function showNavBar() {
    if (Platform.OS === 'android') {
        if (!NavBarColor.showNavigationBar) {
            throw Error('NavBarColor unavalible');
        }
        NavBarColor.showNavigationBar();
    } else {
        return false;
    }
};