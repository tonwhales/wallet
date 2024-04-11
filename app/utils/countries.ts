import { getCountry } from 'react-native-localize';
import { getStoreFront } from '../modules/StoreFront';

export interface Country {
    countryNameEn: string;
    alpha2: string;
    alpha3: string;
}

type CountriesBase = {
    [key: string]: Country;
}

let countries: Country[] = [
    { countryNameEn: "Albania", alpha2: "AL", alpha3: "ALB" },
    { countryNameEn: "Afghanistan", alpha2: "AF", alpha3: "AFG" },
    { countryNameEn: "The Bahamas", alpha2: "BS", alpha3: "BHS" },
    { countryNameEn: "Barbados", alpha2: "BB", alpha3: "BRB" },
    { countryNameEn: "Botswana", alpha2: "BW", alpha3: "BWA" },
    { countryNameEn: "Burkina Faso", alpha2: "BF", alpha3: "BFA" },
    { countryNameEn: "Cambodia", alpha2: "KH", alpha3: "KHM" },
    { countryNameEn: "Cayman Islands", alpha2: "KY", alpha3: "CYM" },
    { countryNameEn: "Cuba", alpha2: "CU", alpha3: "CUB" },
    { countryNameEn: "Democratic People's Republic of Korea (North Korea)", alpha2: "KP", alpha3: "PRK" },
    { countryNameEn: "Haiti", alpha2: "HT", alpha3: "HTI" },
    { countryNameEn: "Ghana", alpha2: "GH", alpha3: "GHA" },
    { countryNameEn: "Jamaica", alpha2: "JM", alpha3: "JAM" },
    { countryNameEn: "Iran", alpha2: "IR", alpha3: "IRN" },
    { countryNameEn: "Iraq", alpha2: "IQ", alpha3: "IRQ" },
    { countryNameEn: "Gibraltar", alpha2: "GI", alpha3: "GIB" },
    { countryNameEn: "Mauritius", alpha2: "MU", alpha3: "MUS" },
    { countryNameEn: "Morocco", alpha2: "MA", alpha3: "MAR" },
    { countryNameEn: "Myanmar (Burma)", alpha2: "MM", alpha3: "MMR" },
    { countryNameEn: "Nicaragua", alpha2: "NI", alpha3: "NIC" },
    { countryNameEn: "Pakistan", alpha2: "PK", alpha3: "PAK" },
    { countryNameEn: "Panama", alpha2: "PA", alpha3: "PAN" },
    { countryNameEn: "Philippines", alpha2: "PH", alpha3: "PHL" },
    { countryNameEn: "Senegal", alpha2: "SN", alpha3: "SEN" },
    { countryNameEn: "South Sudan", alpha2: "SS", alpha3: "SSD" },
    { countryNameEn: "Syria", alpha2: "SY", alpha3: "SYR" },
    { countryNameEn: "Trinidad and Tobago", alpha2: "TT", alpha3: "TTO" },
    { countryNameEn: "Uganda", alpha2: "UG", alpha3: "UGA" },
    { countryNameEn: "Vanuatu", alpha2: "VU", alpha3: "VUT" },
    { countryNameEn: "Yemen", alpha2: "YE", alpha3: "YEM" },
    { countryNameEn: "Angola", alpha2: "AO", alpha3: "AGO" },
    { countryNameEn: "Burundi", alpha2: "BI", alpha3: "BDI" },
    { countryNameEn: "Central African Republic", alpha2: "CF", alpha3: "CAF" },
    { countryNameEn: "Congo", alpha2: "CG", alpha3: "COG" },
    { countryNameEn: "Democratic Republic of the Congo", alpha2: "CD", alpha3: "COD" },
    { countryNameEn: "Guinea-Bissau", alpha2: "GW", alpha3: "GNB" },
    { countryNameEn: "Liberia", alpha2: "LR", alpha3: "LBR" },
    { countryNameEn: "Libya", alpha2: "LY", alpha3: "LBY" },
    { countryNameEn: "Mali", alpha2: "ML", alpha3: "MLI" },
    { countryNameEn: "Sierra Leone", alpha2: "SL", alpha3: "SLE" },
    { countryNameEn: "Somalia", alpha2: "SO", alpha3: "SOM" },
    { countryNameEn: "Cote d'Ivoire (Ivory Coast)", alpha2: "CI", alpha3: "CIV" },
    { countryNameEn: "United States of America (USA)", alpha2: "US", alpha3: "USA" },
    { countryNameEn: "Zimbabwe", alpha2: "ZW", alpha3: "ZWE" }
];

function hasCode(countryCode: string) {
    return countries.some((country) => country.alpha2 === countryCode || country.alpha3 === countryCode);
}

export function isBuyAvailable() {
    const countryCode = getCountry();
    const storeFrontCode = getStoreFront();
    const isAvailableByCountry = !hasCode(countryCode);
    const isAvailableByStoreFront = storeFrontCode ? !hasCode(storeFrontCode) : false;

    return isAvailableByCountry && isAvailableByStoreFront;
}

export function getCountryCodes() {
    const countryCode = getCountry();
    const storeFrontCode = getStoreFront();

    return { countryCode, storeFrontCode };
}