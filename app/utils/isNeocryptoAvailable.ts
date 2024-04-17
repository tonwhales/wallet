import { getCountry } from 'react-native-localize';
import { getStoreFront } from '../modules/StoreFront';

const neocryptoNonEligibleCountriesAlpha2 = new Map([
    ["AL", "Albania"],
    ["AF", "Afghanistan"],
    ["BS", "The Bahamas"],
    ["BB", "Barbados"],
    ["BW", "Botswana"],
    ["BF", "Burkina Faso"],
    ["KH", "Cambodia"],
    ["KY", "Cayman Islands"],
    ["CU", "Cuba"],
    ["KP", "Democratic People's Republic of Korea (North Korea)"],
    ["HT", "Haiti"],
    ["GH", "Ghana"],
    ["JM", "Jamaica"],
    ["IR", "Iran"],
    ["IQ", "Iraq"],
    ["GI", "Gibraltar"],
    ["MU", "Mauritius"],
    ["MA", "Morocco"],
    ["MM", "Myanmar (Burma)"],
    ["NI", "Nicaragua"],
    ["PK", "Pakistan"],
    ["PA", "Panama"],
    ["PH", "Philippines"],
    ["SN", "Senegal"],
    ["SS", "South Sudan"],
    ["SY", "Syria"],
    ["TT", "Trinidad and Tobago"],
    ["UG", "Uganda"],
    ["VU", "Vanuatu"],
    ["YE", "Yemen"],
    ["AO", "Angola"],
    ["BI", "Burundi"],
    ["CF", "Central African Republic"],
    ["CG", "Congo"],
    ["CD", "Democratic Republic of the Congo"],
    ["GW", "Guinea-Bissau"],
    ["LR", "Liberia"],
    ["LY", "Libya"],
    ["ML", "Mali"],
    ["SL", "Sierra Leone"],
    ["SO", "Somalia"],
    ["CI", "Cote d'Ivoire (Ivory Coast)"],
    ["US", "United States of America (USA)"],
    ["ZW", "Zimbabwe"]
]);

const neocryptoNonEligibleCountriesAlpha3 = new Map([
    ["ALB", "Albania"],
    ["AFG", "Afghanistan"],
    ["BHS", "The Bahamas"],
    ["BRB", "Barbados"],
    ["BWA", "Botswana"],
    ["BFA", "Burkina Faso"],
    ["KHM", "Cambodia"],
    ["CYM", "Cayman Islands"],
    ["CUB", "Cuba"],
    ["PRK", "Democratic People's Republic of Korea (North Korea)"],
    ["HTI", "Haiti"],
    ["GHA", "Ghana"],
    ["JAM", "Jamaica"],
    ["IRN", "Iran"],
    ["IRQ", "Iraq"],
    ["GIB", "Gibraltar"],
    ["MUS", "Mauritius"],
    ["MAR", "Morocco"],
    ["MMR", "Myanmar (Burma)"],
    ["NIC", "Nicaragua"],
    ["PAK", "Pakistan"],
    ["PAN", "Panama"],
    ["PHL", "Philippines"],
    ["SEN", "Senegal"],
    ["SSD", "South Sudan"],
    ["SYR", "Syria"],
    ["TTO", "Trinidad and Tobago"],
    ["UGA", "Uganda"],
    ["VUT", "Vanuatu"],
    ["YEM", "Yemen"],
    ["AGO", "Angola"],
    ["BDI", "Burundi"],
    ["CAF", "Central African Republic"],
    ["COG", "Congo"],
    ["COD", "Democratic Republic of the Congo"],
    ["GNB", "Guinea-Bissau"],
    ["LBR", "Liberia"],
    ["LBY", "Libya"],
    ["MLI", "Mali"],
    ["SLE", "Sierra Leone"],
    ["SOM", "Somalia"],
    ["CIV", "Cote d'Ivoire (Ivory Coast)"],
    ["USA", "United States of America (USA)"],
    ["ZWE", "Zimbabwe"]
]);


export function isNeocryptoAvailable() {
    const countryCode = getCountry();
    const storeFrontCode = getStoreFront();
    const isAvailableByCountry = !neocryptoNonEligibleCountriesAlpha2.has(countryCode);
    const isAvailableByStoreFront = storeFrontCode ? !neocryptoNonEligibleCountriesAlpha3.has(storeFrontCode) : false;

    return isAvailableByCountry && isAvailableByStoreFront;
}

export function getCountryCodes() {
    const countryCode = getCountry();
    const storeFrontCode = getStoreFront();

    return { countryCode, storeFrontCode };
}