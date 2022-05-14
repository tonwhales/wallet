import KeyStore from './KeyStoreModule';

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

export async function useDeviceCredentials(): Promise<boolean> {
  try {
    return await getEnrolledLevelAsync() === 1;
  } catch (error) {
    return false;
  }
}

/**
 * **(Android Only)**
 * Determine what kind of authentication is enrolled on the device availible for expo-secure-store.
 * @return Returns a promise which fulfils with [`SecurityLevel`](#securitylevel).
 * > **Note:** On Android devices prior to M, `SECRET` can be returned if only the SIM lock has been
 * enrolled.
 */
export async function getEnrolledLevelAsync(): Promise<SecurityLevel> {
  if (!KeyStore.getEnrolledLevelAsync) {
    throw Error('KeyStore unavalible');
  }
  return await KeyStore.getEnrolledLevelAsync();
}

const VALUE_BYTES_LIMIT = 2048;

// @needsAudit
/**
 * Returns whether the DeviceCredentialsStore API is enabled on the current device. This does not check the app
 * permissions.
 *
 * @return Promise which fulfils witch `boolean`, indicating whether the DeviceCredentialsStore API is available
 * on the current device. Currently this resolves `true` on iOS and Android only.
 */
export async function isAvailableAsync(): Promise<boolean> {
  return !!KeyStore.getValueWithKeyAsync;
}

// @needsAudit
/**
 * Delete the value associated with the provided key.
 *
 * @param key The key that was used to store the associated value.
 * 
 * @return A promise that will reject if the value couldn't be deleted.
 */
export async function deleteItemAsync(
  key: string,
): Promise<void> {
  _ensureValidKey(key);

  if (!KeyStore.deleteValueWithKeyAsync) {
    throw new Error('KeyStore deleteItemAsync unawalible');
  }
  await KeyStore.deleteValueWithKeyAsync(key);
}

// @needsAudit
/**
 * Fetch the stored value associated with the provided key.
 *
 * @param key The key that was used to store the associated value.
 *
 * @return A promise that resolves to the previously stored value, or `null` if there is no entry
 * for the given key. The promise will reject if an error occurred while retrieving the value.
 */
export async function getItemAsync(
  key: string
): Promise<string | null> {
  _ensureValidKey(key);
  return await KeyStore.getValueWithKeyAsync(key);
}

// @needsAudit
/**
 * Store a key–value pair.
 *
 * @param key The key to associate with the stored value. Keys may contain alphanumeric characters
 * `.`, `-`, and `_`.
 * @param value The value to store. Size limit is 2048 bytes.
 *
 * @return A promise that will reject if value cannot be stored on the device.
 */
export async function setItemAsync(
  key: string,
  value: string
): Promise<void> {
  _ensureValidKey(key);
  if (!_isValidValue(value)) {
    throw new Error(
      `Invalid value provided to DeviceCredentialsStore. Values must be strings; consider JSON-encoding your values if they are serializable.`
    );
  }
  if (!KeyStore.setValueWithKeyAsync) {
    throw new Error('KeyStore setItemAsync unavalible');
  }
  await KeyStore.setValueWithKeyAsync(value, key);
}

function _ensureValidKey(key: string) {
  if (!_isValidKey(key)) {
    throw new Error(
      `Invalid key provided to DeviceCredentialsStore. Keys must not be empty and contain only alphanumeric characters, ".", "-", and "_".`
    );
  }
}

function _isValidKey(key: string) {
  return typeof key === 'string' && /^[\w.-]+$/.test(key);
}

function _isValidValue(value: string) {
  if (typeof value !== 'string') {
    return false;
  }
  if (_byteCount(value) > VALUE_BYTES_LIMIT) {
    console.warn(
      'Provided value to DeviceCredentialsStore is larger than 2048 bytes. An attempt to store such a value will throw an error in SDK 35.'
    );
  }
  return true;
}

// copy-pasted from https://stackoverflow.com/a/39488643
function _byteCount(value: string) {
  let bytes = 0;

  for (let i = 0; i < value.length; i++) {
    const codePoint = value.charCodeAt(i);

    // Lone surrogates cannot be passed to encodeURI
    if (codePoint >= 0xd800 && codePoint < 0xe000) {
      if (codePoint < 0xdc00 && i + 1 < value.length) {
        const next = value.charCodeAt(i + 1);

        if (next >= 0xdc00 && next < 0xe000) {
          bytes += 4;
          i++;
          continue;
        }
      }
    }

    bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : 3;
  }

  return bytes;
}
