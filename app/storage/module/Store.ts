import KeychainStoreModule from './KeychainStoreModule';

export enum SecurityLevel {
  /**
   * Indicates no enrolled authentication.
   */
  NONE = 0,
  /**
   * Indicates non-biometric authentication (e.g. PIN, Pattern).
   */
  SECRET = 1,
  /**
   * Indicates biometric authentication.
   */
  BIOMETRIC = 2,
}

/**
 * **(Android Only)**
 * Determine what kind of authentication is enrolled on the device availible for expo-secure-store.
 * @return Returns a promise which fulfils with [`SecurityLevel`](#securitylevel).
 * > **Note:** On Android devices prior to M, `SECRET` can be returned if only the SIM lock has been
 * enrolled.
 */
export async function getEnrolledLevelAsync(): Promise<SecurityLevel> {
  if (!KeychainStoreModule.getEnrolledLevelAsync) {
    throw Error('KeychainStoreModule unavalible');
  }
  return await KeychainStoreModule.getEnrolledLevelAsync();
}