import { getCountry } from 'react-native-localize';
import { Country } from './Country';
import { getStoreFront } from '../modules/StoreFront';
import { useEffect, useState } from 'react';
// source: https://github.com/datasets/country-codes/blob/master/data/country-codes.csv
export const countries: Country[] = [
    { value: "+93", shortname: "AF", label: "Afghanistan", emoji: '🇦🇫' },
    { value: "+355", shortname: "AL", label: "Albania", emoji: '🇦🇱' },
    { value: "+213", shortname: "DZ", label: "Algeria", emoji: '🇩🇿' },
    { value: "+1684", shortname: "AS", label: "American Samoa", emoji: '🇦🇸' },
    { value: "+376", shortname: "AD", label: "Andorra", emoji: '🇦🇩' },
    { value: "+244", shortname: "AO", label: "Angola", emoji: '🇦🇴' },
    { value: "+1264", shortname: "AI", label: "Anguilla", emoji: '🇦🇮' },
    { value: "+1268", shortname: "AG", label: "Antigua & Barbuda", emoji: '🇦🇬' },
    { value: "+54", shortname: "AR", label: "Argentina", emoji: '🇦🇷' },
    { value: "+374", shortname: "AM", label: "Armenia", emoji: '🇦🇲' },
    { value: "+297", shortname: "AW", label: "Aruba", emoji: '🇦🇼' },
    { value: "+61", shortname: "AU", label: "Australia", emoji: '🇦🇺' },
    { value: "+43", shortname: "AT", label: "Austria", emoji: '🇦🇹' },
    { value: "+994", shortname: "AZ", label: "Azerbaijan", emoji: '🇦🇿' },
    { value: "+1242", shortname: "BS", label: "Bahamas", emoji: '🇧🇸' },
    { value: "+973", shortname: "BH", label: "Bahrain", emoji: '🇧🇭' },
    { value: "+880", shortname: "BD", label: "Bangladesh", emoji: '🇧🇩' },
    { value: "+1246", shortname: "BB", label: "Barbados", emoji: '🇧🇧' },
    { value: "+375", shortname: "BY", label: "Belarus", emoji: '🇧🇾' },
    { value: "+32", shortname: "BE", label: "Belgium", emoji: '🇧🇪' },
    { value: "+501", shortname: "BZ", label: "Belize", emoji: '🇧🇿' },
    { value: "+229", shortname: "BJ", label: "Benin", emoji: '🇧🇯' },
    { value: "+1441", shortname: "BM", label: "Bermuda", emoji: '🇧🇲' },
    { value: "+975", shortname: "BT", label: "Bhutan", emoji: '🇧🇹' },
    { value: "+591", shortname: "BO", label: "Bolivia", emoji: '🇧🇴' },
    { value: "+387", shortname: "BA", label: "Bosnia", emoji: '🇧🇦' },
    { value: "+267", shortname: "BW", label: "Botswana", emoji: '🇧🇼' },
    { value: "+55", shortname: "BR", label: "Brazil", emoji: '🇧🇷' },
    { value: "+246", shortname: "IO", label: "British Indian Ocean Territory", emoji: '🇮🇴' },
    { value: "+1284", shortname: "VG", label: "British Virgin Islands", emoji: '🇻🇬' },
    { value: "+673", shortname: "BN", label: "Brunei", emoji: '🇧🇳' },
    { value: "+359", shortname: "BG", label: "Bulgaria", emoji: '🇧🇬' },
    { value: "+226", shortname: "BF", label: "Burkina Faso", emoji: '🇧🇫' },
    { value: "+257", shortname: "BI", label: "Burundi", emoji: '🇧🇮' },
    { value: "+855", shortname: "KH", label: "Cambodia", emoji: '🇰🇭' },
    { value: "+237", shortname: "CM", label: "Cameroon", emoji: '🇨🇲' },
    { value: "+1", shortname: "CA", label: "Canada", emoji: '🇨🇦' },
    { value: "+238", shortname: "CV", label: "Cape Verde", emoji: '🇨🇻' },
    { value: "+599", shortname: "BQ", label: "Caribbean Netherlands", emoji: '🇳🇱' },
    { value: "+1345", shortname: "KY", label: "Cayman Islands", emoji: '🇰🇾' },
    { value: "+236", shortname: "CF", label: "Central African Republic", emoji: '🇨🇫' },
    { value: "+235", shortname: "TD", label: "Chad", emoji: '🇹🇩' },
    { value: "+56", shortname: "CL", label: "Chile", emoji: '🇨🇱' },
    { value: "+86", shortname: "CN", label: "China", emoji: '🇨🇳' },
    { value: "+61", shortname: "CX", label: "Christmas Island", emoji: '🇨🇽' },
    { value: "+61", shortname: "CC", label: "Cocos (Keeling) Islands", emoji: '🇨🇨' },
    { value: "+57", shortname: "CO", label: "Colombia", emoji: '🇨🇴' },
    { value: "+269", shortname: "KM", label: "Comoros", emoji: '🇰🇲' },
    { value: "+242", shortname: "CG", label: "Congo - Brazzaville", emoji: '🇨🇬' },
    { value: "+243", shortname: "CD", label: "Congo - Kinshasa", emoji: '🇨🇩' },
    { value: "+682", shortname: "CK", label: "Cook Islands", emoji: '🇨🇰' },
    { value: "+506", shortname: "CR", label: "Costa Rica", emoji: '🇨🇷' },
    { value: "+385", shortname: "HR", label: "Croatia", emoji: '🇭🇷' },
    { value: "+53", shortname: "CU", label: "Cuba", emoji: '🇨🇺' },
    { value: "+599", shortname: "CW", label: "Curaçao", emoji: '🇨🇼' },
    { value: "+357", shortname: "CY", label: "Cyprus", emoji: '🇨🇾' },
    { value: "+420", shortname: "CZ", label: "Czechia", emoji: '🇨🇿' },
    { value: "+225", shortname: "CI", label: "Côte d’Ivoire", emoji: '🇨🇮' },
    { value: "+45", shortname: "DK", label: "Denmark", emoji: '🇩🇰' },
    { value: "+253", shortname: "DJ", label: "Djibouti", emoji: '🇩🇯' },
    { value: "+1767", shortname: "DM", label: "Dominica", emoji: '🇩🇲' },
    { value: "+1809", shortname: "DO", label: "Dominican Republic", emoji: '🇩🇴' },
    { value: "+1829", shortname: "DO", label: "Dominican Republic", emoji: '🇩🇴' },
    { value: "+1849", shortname: "DO", label: "Dominican Republic", emoji: '🇩🇴' },
    { value: "+593", shortname: "EC", label: "Ecuador", emoji: '🇪🇨' },
    { value: "+20", shortname: "EG", label: "Egypt", emoji: '🇪🇬' },
    { value: "+503", shortname: "SV", label: "El Salvador", emoji: '🇸🇻' },
    { value: "+240", shortname: "GQ", label: "Equatorial Guinea", emoji: '🇬🇶' },
    { value: "+291", shortname: "ER", label: "Eritrea", emoji: '🇪🇷' },
    { value: "+372", shortname: "EE", label: "Estonia", emoji: '🇪🇪' },
    { value: "+268", shortname: "SZ", label: "Eswatini", emoji: '🇸🇿' },
    { value: "+251", shortname: "ET", label: "Ethiopia", emoji: '🇪🇹' },
    { value: "+500", shortname: "FK", label: "Falkland Islands", emoji: '🇫🇰' },
    { value: "+298", shortname: "FO", label: "Faroe Islands", emoji: '🇫🇴' },
    { value: "+679", shortname: "FJ", label: "Fiji", emoji: '🇫🇯' },
    { value: "+358", shortname: "FI", label: "Finland", emoji: '🇫🇮' },
    { value: "+33", shortname: "FR", label: "France", emoji: '🇫🇷' },
    { value: "+594", shortname: "GF", label: "French Guiana", emoji: '🇬🇫' },
    { value: "+689", shortname: "PF", label: "French Polynesia", emoji: '🇵🇫' },
    { value: "+241", shortname: "GA", label: "Gabon", emoji: '🇬🇦' },
    { value: "+220", shortname: "GM", label: "Gambia", emoji: '🇬🇲' },
    { value: "+995", shortname: "GE", label: "Georgia", emoji: '🇬🇪' },
    { value: "+49", shortname: "DE", label: "Germany", emoji: '🇩🇪' },
    { value: "+233", shortname: "GH", label: "Ghana", emoji: '🇬🇭' },
    { value: "+350", shortname: "GI", label: "Gibraltar", emoji: '🇬🇮' },
    { value: "+30", shortname: "GR", label: "Greece", emoji: '🇬🇷' },
    { value: "+299", shortname: "GL", label: "Greenland", emoji: '🇬🇱' },
    { value: "+1473", shortname: "GD", label: "Grenada", emoji: '🇬🇩' },
    { value: "+590", shortname: "GP", label: "Guadeloupe", emoji: '🇬🇵' },
    { value: "+1671", shortname: "GU", label: "Guam", emoji: '🇬🇺' },
    { value: "+502", shortname: "GT", label: "Guatemala", emoji: '🇬🇹' },
    { value: "+44", shortname: "GG", label: "Guernsey", emoji: '🇬🇬' },
    { value: "+224", shortname: "GN", label: "Guinea", emoji: '🇬🇳' },
    { value: "+245", shortname: "GW", label: "Guinea-Bissau", emoji: '🇬🇼' },
    { value: "+592", shortname: "GY", label: "Guyana", emoji: '🇬🇾' },
    { value: "+509", shortname: "HT", label: "Haiti", emoji: '🇭🇹' },
    { value: "+504", shortname: "HN", label: "Honduras", emoji: '🇭🇳' },
    { value: "+852", shortname: "HK", label: "Hong Kong", emoji: '🇭🇰' },
    { value: "+36", shortname: "HU", label: "Hungary", emoji: '🇭🇺' },
    { value: "+354", shortname: "IS", label: "Iceland", emoji: '🇮🇸' },
    { value: "+91", shortname: "IN", label: "India", emoji: '🇮🇳' },
    { value: "+62", shortname: "ID", label: "Indonesia", emoji: '🇮🇩' },
    { value: "+98", shortname: "IR", label: "Iran", emoji: '🇮🇷' },
    { value: "+964", shortname: "IQ", label: "Iraq", emoji: '🇮🇶' },
    { value: "+353", shortname: "IE", label: "Ireland", emoji: '🇮🇪' },
    { value: "+44", shortname: "IM", label: "Isle of Man", emoji: '🇮🇲' },
    { value: "+972", shortname: "IL", label: "Israel", emoji: '🇮🇱' },
    { value: "+39", shortname: "IT", label: "Italy", emoji: '🇮🇹' },
    { value: "+1876", shortname: "JM", label: "Jamaica", emoji: '🇯🇲' },
    { value: "+81", shortname: "JP", label: "Japan", emoji: '🇯🇵' },
    { value: "+44", shortname: "JE", label: "Jersey", emoji: '🇯🇪' },
    { value: "+962", shortname: "JO", label: "Jordan", emoji: '🇯🇴' },
    { value: "+7", shortname: "KZ", label: "Kazakhstan", emoji: '🇰🇿' },
    { value: "+254", shortname: "KE", label: "Kenya", emoji: '🇰🇪' },
    { value: "+686", shortname: "KI", label: "Kiribati", emoji: '🇰🇮' },
    { value: "+965", shortname: "KW", label: "Kuwait", emoji: '🇰🇼' },
    { value: "+996", shortname: "KG", label: "Kyrgyzstan", emoji: '🇰🇬' },
    { value: "+856", shortname: "LA", label: "Laos", emoji: '🇱🇦' },
    { value: "+371", shortname: "LV", label: "Latvia", emoji: '🇱🇻' },
    { value: "+961", shortname: "LB", label: "Lebanon", emoji: '🇱🇧' },
    { value: "+266", shortname: "LS", label: "Lesotho", emoji: '🇱🇸' },
    { value: "+231", shortname: "LR", label: "Liberia", emoji: '🇱🇷' },
    { value: "+218", shortname: "LY", label: "Libya", emoji: '🇱🇾' },
    { value: "+423", shortname: "LI", label: "Liechtenstein", emoji: '🇱🇮' },
    { value: "+370", shortname: "LT", label: "Lithuania", emoji: '🇱🇹' },
    { value: "+352", shortname: "LU", label: "Luxembourg", emoji: '🇱🇺' },
    { value: "+853", shortname: "MO", label: "Macau", emoji: '🇲🇴' },
    { value: "+261", shortname: "MG", label: "Madagascar", emoji: '🇲🇬' },
    { value: "+265", shortname: "MW", label: "Malawi", emoji: '🇲🇼' },
    { value: "+60", shortname: "MY", label: "Malaysia", emoji: '🇲🇾' },
    { value: "+960", shortname: "MV", label: "Maldives", emoji: '🇲🇻' },
    { value: "+223", shortname: "ML", label: "Mali", emoji: '🇲🇱' },
    { value: "+356", shortname: "MT", label: "Malta", emoji: '🇲🇹' },
    { value: "+692", shortname: "MH", label: "Marshall Islands", emoji: '🇲🇭' },
    { value: "+596", shortname: "MQ", label: "Martinique", emoji: '🇲🇶' },
    { value: "+222", shortname: "MR", label: "Mauritania", emoji: '🇲🇷' },
    { value: "+230", shortname: "MU", label: "Mauritius", emoji: '🇲🇺' },
    { value: "+262", shortname: "YT", label: "Mayotte", emoji: '🇾🇹' },
    { value: "+52", shortname: "MX", label: "Mexico", emoji: '🇲🇽' },
    { value: "+691", shortname: "FM", label: "Micronesia", emoji: '🇫🇲' },
    { value: "+373", shortname: "MD", label: "Moldova", emoji: '🇲🇩' },
    { value: "+377", shortname: "MC", label: "Monaco", emoji: '🇲🇨' },
    { value: "+976", shortname: "MN", label: "Mongolia", emoji: '🇲🇳' },
    { value: "+382", shortname: "ME", label: "Montenegro", emoji: '🇲🇪' },
    { value: "+1664", shortname: "MS", label: "Montserrat", emoji: '🇲🇸' },
    { value: "+212", shortname: "MA", label: "Morocco", emoji: '🇲🇦' },
    { value: "+258", shortname: "MZ", label: "Mozambique", emoji: '🇲🇿' },
    { value: "+95", shortname: "MM", label: "Myanmar", emoji: '🇲🇲' },
    { value: "+264", shortname: "NA", label: "Namibia", emoji: '🇳🇦' },
    { value: "+674", shortname: "NR", label: "Nauru", emoji: '🇳🇷' },
    { value: "+977", shortname: "NP", label: "Nepal", emoji: '🇳🇵' },
    { value: "+31", shortname: "NL", label: "Netherlands", emoji: '🇳🇱' },
    { value: "+687", shortname: "NC", label: "New Caledonia", emoji: '🇳🇨' },
    { value: "+64", shortname: "NZ", label: "New Zealand", emoji: '🇳🇿' },
    { value: "+505", shortname: "NI", label: "Nicaragua", emoji: '🇳🇮' },
    { value: "+227", shortname: "NE", label: "Niger", emoji: '🇳🇪' },
    { value: "+234", shortname: "NG", label: "Nigeria", emoji: '🇳🇬' },
    { value: "+683", shortname: "NU", label: "Niue", emoji: '🇳🇺' },
    { value: "+672", shortname: "NF", label: "Norfolk Island", emoji: '🇳🇫' },
    { value: "+850", shortname: "KP", label: "North Korea", emoji: '🇰🇵' },
    { value: "+389", shortname: "MK", label: "North Macedonia", emoji: '🇲🇰' },
    { value: "+1670", shortname: "MP", label: "Northern Mariana Islands", emoji: '🇲🇵' },
    { value: "+47", shortname: "NO", label: "Norway", emoji: '🇳🇴' },
    { value: "+968", shortname: "OM", label: "Oman", emoji: '🇴🇲' },
    { value: "+92", shortname: "PK", label: "Pakistan", emoji: '🇵🇰' },
    { value: "+680", shortname: "PW", label: "Palau", emoji: '🇵🇼' },
    { value: "+970", shortname: "PS", label: "Palestine", emoji: '🇵🇸' },
    { value: "+507", shortname: "PA", label: "Panama", emoji: '🇵🇦' },
    { value: "+675", shortname: "PG", label: "Papua New Guinea", emoji: '🇵🇬' },
    { value: "+595", shortname: "PY", label: "Paraguay", emoji: '🇵🇾' },
    { value: "+51", shortname: "PE", label: "Peru", emoji: '🇵🇪' },
    { value: "+63", shortname: "PH", label: "Philippines", emoji: '🇵🇭' },
    { value: "+48", shortname: "PL", label: "Poland", emoji: '🇵🇱' },
    { value: "+351", shortname: "PT", label: "Portugal", emoji: '🇵🇹' },
    { value: "+1", shortname: "PR", label: "Puerto Rico", emoji: '🇵🇷' },
    { value: "+974", shortname: "QA", label: "Qatar", emoji: '🇶🇦' },
    { value: "+40", shortname: "RO", label: "Romania", emoji: '🇷🇴' },
    { value: "+7", shortname: "RU", label: "Russia", emoji: '🇷🇺' },
    { value: "+250", shortname: "RW", label: "Rwanda", emoji: '🇷🇼' },
    { value: "+262", shortname: "RE", label: "Réunion", emoji: '🇷🇪' },
    { value: "+685", shortname: "WS", label: "Samoa", emoji: '🇼🇸' },
    { value: "+378", shortname: "SM", label: "San Marino", emoji: '🇸🇲' },
    { value: "+966", shortname: "SA", label: "Saudi Arabia", emoji: '🇸🇦' },
    { value: "+221", shortname: "SN", label: "Senegal", emoji: '🇸🇳' },
    { value: "+381", shortname: "RS", label: "Serbia", emoji: '🇷🇸' },
    { value: "+248", shortname: "SC", label: "Seychelles", emoji: '🇸🇨' },
    { value: "+232", shortname: "SL", label: "Sierra Leone", emoji: '🇸🇱' },
    { value: "+65", shortname: "SG", label: "Singapore", emoji: '🇸🇬' },
    { value: "+1721", shortname: "SX", label: "Sint Maarten", emoji: '🇸🇽' },
    { value: "+421", shortname: "SK", label: "Slovakia", emoji: '🇸🇰' },
    { value: "+386", shortname: "SI", label: "Slovenia", emoji: '🇸🇮' },
    { value: "+677", shortname: "SB", label: "Solomon Islands", emoji: '🇸🇧' },
    { value: "+252", shortname: "SO", label: "Somalia", emoji: '🇸🇴' },
    { value: "+27", shortname: "ZA", label: "South Africa", emoji: '🇿🇦' },
    { value: "+82", shortname: "KR", label: "South Korea", emoji: '🇰🇷' },
    { value: "+211", shortname: "SS", label: "South Sudan", emoji: '🇸🇸' },
    { value: "+34", shortname: "ES", label: "Spain", emoji: '🇪🇸' },
    { value: "+94", shortname: "LK", label: "Sri Lanka", emoji: '🇱🇰' },
    { value: "+590", shortname: "BL", label: "St. Barthélemy", emoji: '🇧🇱' },
    { value: "+290", shortname: "SH", label: "St. Helena", emoji: '🇸🇭' },
    { value: "+1869", shortname: "KN", label: "St. Kitts & Nevis", emoji: '🇰🇳' },
    { value: "+1758", shortname: "LC", label: "St. Lucia", emoji: '🇱🇨' },
    { value: "+590", shortname: "MF", label: "St. Martin", emoji: '🇲🇶' },
    { value: "+508", shortname: "PM", label: "St. Pierre & Miquelon", emoji: '🇵🇲' },
    { value: "+1784", shortname: "VC", label: "St. Vincent & Grenadines", emoji: '🇻🇨' },
    { value: "+249", shortname: "SD", label: "Sudan", emoji: '🇸🇩' },
    { value: "+597", shortname: "SR", label: "Suriname", emoji: '🇸🇷' },
    { value: "+47", shortname: "SJ", label: "Svalbard & Jan Mayen", emoji: '🇳🇴' /* Norway flag */ },
    { value: "+46", shortname: "SE", label: "Sweden", emoji: '🇸🇪' },
    { value: "+41", shortname: "CH", label: "Switzerland", emoji: '🇨🇭' },
    { value: "+963", shortname: "SY", label: "Syria", emoji: '🇸🇾' },
    { value: "+239", shortname: "ST", label: "São Tomé & Príncipe", emoji: '🇸🇹' },
    { value: "+886", shortname: "TW", label: "Taiwan", emoji: '🇹🇼' },
    { value: "+992", shortname: "TJ", label: "Tajikistan", emoji: '🇹🇯' },
    { value: "+255", shortname: "TZ", label: "Tanzania", emoji: '🇹🇿' },
    { value: "+66", shortname: "TH", label: "Thailand", emoji: '🇹🇭' },
    { value: "+670", shortname: "TL", label: "Timor-Leste", emoji: '🇹🇱' },
    { value: "+228", shortname: "TG", label: "Togo", emoji: '🇹🇬' },
    { value: "+690", shortname: "TK", label: "Tokelau", emoji: '🇹🇰' },
    { value: "+676", shortname: "TO", label: "Tonga", emoji: '🇹🇴' },
    { value: "+1868", shortname: "TT", label: "Trinidad & Tobago", emoji: '🇹🇹' },
    { value: "+216", shortname: "TN", label: "Tunisia", emoji: '🇹🇳' },
    { value: "+90", shortname: "TR", label: "Turkey", emoji: '🇹🇷' },
    { value: "+993", shortname: "TM", label: "Turkmenistan", emoji: '🇹🇲' },
    { value: "+1649", shortname: "TC", label: "Turks & Caicos Islands", emoji: '🇹🇨' },
    { value: "+688", shortname: "TV", label: "Tuvalu", emoji: '🇹🇻' },
    { value: "+1340", shortname: "VI", label: "U.S. Virgin Islands", emoji: '🇻🇮' },
    { value: "+44", shortname: "GB", label: "United Kingdom", emoji: '🇬🇧' },
    { value: "+1", shortname: "US", label: "United States", emoji: '🇺🇸' },
    { value: "+256", shortname: "UG", label: "Uganda", emoji: '🇺🇬' },
    { value: "+380", shortname: "UA", label: "Ukraine", emoji: '🇺🇦' },
    { value: "+971", shortname: "AE", label: "United Arab Emirates", emoji: '🇦🇪' },
    { value: "+598", shortname: "UY", label: "Uruguay", emoji: '🇺🇾' },
    { value: "+998", shortname: "UZ", label: "Uzbekistan", emoji: '🇺🇿' },
    { value: "+678", shortname: "VU", label: "Vanuatu", emoji: '🇻🇺' },
    { value: "+3906", shortname: "VA", label: "Vatican City", emoji: '🇻🇦' },
    { value: "+58", shortname: "VE", label: "Venezuela", emoji: '🇻🇪' },
    { value: "+84", shortname: "VN", label: "Vietnam", emoji: '🇻🇳' },
    { value: "+681", shortname: "WF", label: "Wallis & Futuna", emoji: '🇼🇫' },
    { value: "+212", shortname: "EH", label: "Western Sahara", emoji: '🇪🇭' },
    { value: "+967", shortname: "YE", label: "Yemen", emoji: '🇾🇪' },
    { value: "+260", shortname: "ZM", label: "Zambia", emoji: '🇿🇲' },
    { value: "+263", shortname: "ZW", label: "Zimbabwe", emoji: '🇿🇼' },
    { value: "+358", shortname: "AX", label: "Åland Islands", emoji: '🇦🇽' },
];

export const neocryptoNonEligibleCountriesAlpha2 = [
    // Albania
    "AL",
    // Afghanistan
    "AF",
    // The Bahamas
    "BS",
    // Barbados
    "BB",
    // Botswana
    "BW",
    // Burkina Faso
    "BF",
    // Cambodia
    "KH",
    // Cayman Islands
    "KY",
    // Cuba
    "CU",
    // Democratic People's Republic of Korea (North Korea)
    "KP",
    // Haiti
    "HT",
    // Ghana
    "GH",
    // Jamaica
    "JM",
    // Iran
    "IR",
    // Iraq
    "IQ",
    // Gibraltar
    "GI",
    // Mauritius
    "MU",
    // Morocco
    "MA",
    // Myanmar (Burma)
    "MM",
    // Nicaragua
    "NI",
    // Pakistan
    "PK",
    // Panama
    "PA",
    // Philippines
    "PH",
    // Senegal
    "SN",
    // South Sudan
    "SS",
    // Syria
    "SY",
    // Trinidad and Tobago
    "TT",
    // Uganda
    "UG",
    // Vanuatu
    "VU",
    // Yemen
    "YE",
    // Angola
    "AO",
    // Burundi
    "BI",
    // Central African Republic
    "CF",
    // Congo
    "CG",
    // Democratic Republic of the Congo
    "CD",
    // Guinea-Bissau
    "GW",
    // Liberia
    "LR",
    // Libya
    "LY",
    // Mali
    "ML",
    // Sierra Leone
    "SL",
    // Somalia
    "SO",
    // Cote d'Ivoire (Ivory Coast)
    "CI",
    // United States of America (USA)
    "US",
    // Zimbabwe
    "ZW"
];

const neocryptoNonEligibleCountriesAlpha3 = [
    // Albania (ALB)
    "ALB",
    // Afghanistan (AFG)
    "AFG",
    // The Bahamas (BHS)
    "BHS",
    // Barbados (BRB)
    "BRB",
    // Botswana (BWA)
    "BWA",
    // Burkina Faso (BFA)
    "BFA",
    // Cambodia (KHM)
    "KHM",
    // Cayman Islands (CYM)
    "CYM",
    // Cuba (CUB)
    "CUB",
    // Democratic People's Republic of Korea (North Korea) (PRK)
    "PRK",
    // Haiti (HTI)
    "HTI",
    // Ghana (GHA)
    "GHA",
    // Jamaica (JAM)
    "JAM",
    // Iran (IRN)
    "IRN",
    // Iraq (IRQ)
    "IRQ",
    // Gibraltar (GIB)
    "GIB",
    // Mauritius (MUS)
    "MUS",
    // Morocco (MAR)
    "MAR",
    // Myanmar (Burma) (MMR)
    "MMR",
    // Nicaragua (NIC)
    "NIC",
    // Pakistan (PAK)
    "PAK",
    // Panama (PAN)
    "PAN",
    // Philippines (PHL)
    "PHL",
    // Senegal (SEN)
    "SEN",
    // South Sudan (SSD)
    "SSD",
    // Syria (SYR)
    "SYR",
    // Trinidad and Tobago (TTO)
    "TTO",
    // Uganda (UGA)
    "UGA",
    // Vanuatu (VUT)
    "VUT",
    // Yemen (YEM)
    "YEM",
    // Angola (AGO)
    "AGO",
    // Burundi (BDI)
    "BDI",
    // Central African Republic (CAF)
    "CAF",
    // Congo (COG)
    "COG",
    // Democratic Republic of the Congo (COD)
    "COD",
    // Guinea-Bissau (GNB)
    "GNB",
    // Liberia (LBR)
    "LBR",
    // Libya (LBY)
    "LBY",
    // Mali (MLI)
    "MLI",
    // Sierra Leone (SLE)
    "SLE",
    // Somalia (SOM)
    "SOM",
    // Cote d'Ivoire (Ivory Coast) (CIV)
    "CIV",
    // United States of America (USA) (USA)
    "USA",
    // Zimbabwe (ZWE)
    "ZWE"
];


export function neocryptoNonEligibleCountries(standart: 'alpha-2' | 'alpha-3') {
    if (standart === 'alpha-2') {
        return neocryptoNonEligibleCountriesAlpha2;
    }
    return neocryptoNonEligibleCountriesAlpha3;
};

export function useIsBuyAvailable() {
    // ISO 3166-1 alpha-2
    const countryCode = getCountry();
    const isAvailableByCountry = !neocryptoNonEligibleCountries('alpha-2').includes(countryCode);

    const [isBuyAvailable, setIsBuyAvailable] = useState<boolean>(isAvailableByCountry);

    useEffect(() => {
        (async () => {
            // ISO 3166-1 Alpha-3
            const storeFrontCode = await getStoreFront();

            if (!!storeFrontCode) {
                const isAvailableByStoreFront = !neocryptoNonEligibleCountries('alpha-3').includes(storeFrontCode);
                setIsBuyAvailable(isAvailableByStoreFront && isAvailableByCountry);
            }
        })();
    }, []);

    return isBuyAvailable;
}

export async function isBuyNCAvailable(): Promise<boolean> {
    const countryCode = getCountry();
    return !neocryptoNonEligibleCountries('alpha-2').includes(countryCode);
}