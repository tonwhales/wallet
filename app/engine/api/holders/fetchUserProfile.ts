import axios from 'axios';
import { holdersEndpointProd, holdersEndpointStage } from './fetchUserState';

export type AddressInfoT = {
	countryCode: CountryCodeT | undefined;
	city: string | undefined;
	street: string | undefined;
	flatNumber: string | undefined;
	postalCode: string | undefined;
};

export type UserOtpConfirmationT = 'CONFIRMATION_BUTTON' | 'TEXT_CODE';

export type UserOtpCurrentConfigT = {
	confirmationType: UserOtpConfirmationT;
	email: boolean;
	push: boolean;
	sms: boolean;
};

export type UserOtpConfigT = {
	availableProperties: {
		confirmationTypes: UserOtpConfirmationT[];
		email: boolean;
		push: boolean;
		sms: boolean;
	};
	currentConfig: UserOtpCurrentConfigT;
};

export type CountryCodeT =
	| 'AC'
	| 'AD'
	| 'AE'
	| 'AF'
	| 'AG'
	| 'AI'
	| 'AL'
	| 'AM'
	| 'AO'
	| 'AR'
	| 'AS'
	| 'AT'
	| 'AU'
	| 'AW'
	| 'AX'
	| 'AZ'
	| 'BA'
	| 'BB'
	| 'BD'
	| 'BE'
	| 'BF'
	| 'BG'
	| 'BH'
	| 'BI'
	| 'BJ'
	| 'BL'
	| 'BM'
	| 'BN'
	| 'BO'
	| 'BQ'
	| 'BR'
	| 'BS'
	| 'BT'
	| 'BW'
	| 'BY'
	| 'BZ'
	| 'CA'
	| 'CC'
	| 'CD'
	| 'CF'
	| 'CG'
	| 'CH'
	| 'CI'
	| 'CK'
	| 'CL'
	| 'CM'
	| 'CN'
	| 'CO'
	| 'CR'
	| 'CU'
	| 'CV'
	| 'CW'
	| 'CX'
	| 'CY'
	| 'CZ'
	| 'DE'
	| 'DJ'
	| 'DK'
	| 'DM'
	| 'DO'
	| 'DZ'
	| 'EC'
	| 'EE'
	| 'EG'
	| 'EH'
	| 'ER'
	| 'ES'
	| 'ET'
	| 'FI'
	| 'FJ'
	| 'FK'
	| 'FM'
	| 'FO'
	| 'FR'
	| 'GA'
	| 'GB'
	| 'GD'
	| 'GE'
	| 'GF'
	| 'GG'
	| 'GH'
	| 'GI'
	| 'GL'
	| 'GM'
	| 'GN'
	| 'GP'
	| 'GQ'
	| 'GR'
	| 'GT'
	| 'GU'
	| 'GW'
	| 'GY'
	| 'HK'
	| 'HN'
	| 'HR'
	| 'HT'
	| 'HU'
	| 'ID'
	| 'IE'
	| 'IL'
	| 'IM'
	| 'IN'
	| 'IO'
	| 'IQ'
	| 'IR'
	| 'IS'
	| 'IT'
	| 'JE'
	| 'JM'
	| 'JO'
	| 'JP'
	| 'KE'
	| 'KG'
	| 'KH'
	| 'KI'
	| 'KM'
	| 'KN'
	| 'KP'
	| 'KR'
	| 'KW'
	| 'KY'
	| 'KZ'
	| 'LA'
	| 'LB'
	| 'LC'
	| 'LI'
	| 'LK'
	| 'LR'
	| 'LS'
	| 'LT'
	| 'LU'
	| 'LV'
	| 'LY'
	| 'MA'
	| 'MC'
	| 'MD'
	| 'ME'
	| 'MF'
	| 'MG'
	| 'MH'
	| 'MK'
	| 'ML'
	| 'MM'
	| 'MN'
	| 'MO'
	| 'MP'
	| 'MQ'
	| 'MR'
	| 'MS'
	| 'MT'
	| 'MU'
	| 'MV'
	| 'MW'
	| 'MX'
	| 'MY'
	| 'MZ'
	| 'NA'
	| 'NC'
	| 'NE'
	| 'NF'
	| 'NG'
	| 'NI'
	| 'NL'
	| 'NO'
	| 'NP'
	| 'NR'
	| 'NU'
	| 'NZ'
	| 'OM'
	| 'PA'
	| 'PE'
	| 'PF'
	| 'PG'
	| 'PH'
	| 'PK'
	| 'PL'
	| 'PM'
	| 'PR'
	| 'PS'
	| 'PT'
	| 'PW'
	| 'PY'
	| 'QA'
	| 'RE'
	| 'RO'
	| 'RS'
	| 'RU'
	| 'RW'
	| 'SA'
	| 'SB'
	| 'SC'
	| 'SD'
	| 'SE'
	| 'SG'
	| 'SH'
	| 'SI'
	| 'SJ'
	| 'SK'
	| 'SL'
	| 'SM'
	| 'SN'
	| 'SO'
	| 'SR'
	| 'SS'
	| 'ST'
	| 'SV'
	| 'SX'
	| 'SY'
	| 'SZ'
	| 'TA'
	| 'TC'
	| 'TD'
	| 'TG'
	| 'TH'
	| 'TJ'
	| 'TK'
	| 'TL'
	| 'TM'
	| 'TN'
	| 'TO'
	| 'TR'
	| 'TT'
	| 'TV'
	| 'TW'
	| 'TZ'
	| 'UA'
	| 'UG'
	| 'US'
	| 'UY'
	| 'UZ'
	| 'VA'
	| 'VC'
	| 'VE'
	| 'VG'
	| 'VI'
	| 'VN'
	| 'VU'
	| 'WF'
	| 'WS'
	| 'XK'
	| 'YE'
	| 'YT'
	| 'ZA'
	| 'ZM'
	| 'ZW';

export type UserProfileT = {
	userId: string;
	email: string;
	emailVerified: boolean;
	phone: string;
	country: CountryCodeT;
	dateOfBirth: string;
	documentCountry: CountryCodeT;
	documentKind: string;
	documentNumber: string;
	documentValidUntil: string;
	firstName: string;
	lastName: string;
	middleName: string;
	riskScore: string;
	preferredLocale: string | null;
	riskPercent: number;
	otpConfig: UserOtpConfigT;
	address: AddressInfoT;
};

export async function fetchUserProfile(
	token: string,
	isTestnet: boolean
): Promise<UserProfileT | null> {
	const endpoint = isTestnet ? holdersEndpointStage : holdersEndpointProd;
	const res = await axios.post(`https://${endpoint}/v2/profile/get`, { token });

	if (res.status === 401) {
		return null;
	}

	if (!res.data.ok) {
		throw Error('Failed to fetch user profile');
	}

	return res.data.data as UserProfileT;
}
