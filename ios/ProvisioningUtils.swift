//
//  ProvisioningUtils.swift
//  wallet
//
//  Created by VZ on 1/8/24.
//

import Foundation
import PassKit

struct ProvisioningCredential {
  let identifier: String
  let label: String
  let cardholderName: String
  let token: String
  let address: String
  let primaryAccountSuffix: String
  let isTestnet: Bool?
  let assetName: String?
  let assetUrl: String?
}

struct EncryptedPassDataResponse {
  let activationData: Data
  let encryptedPassData: Data
  let ephemeralPublicKey: Data
}

struct EncryptedPassDataRequest: Codable {
  let certificates: [String]
  let nonce: String
  let nonceSignature: String
}

struct AddCardRequest {
  let cardId: String
  let token: String
  let isTestnet: Bool
}

func sendDataToServerForEncryption(cardRequest: AddCardRequest, certificates: [Data], nonce: Data, nonceSignature: Data, completion: @escaping ([String: Any]?, Error?) -> Void) {
  let base = cardRequest.isTestnet ? "https://card-staging.whales-api.com" : "https://card-prod.whales-api.com"
  let baseUrl = "\(base)/v2/card/get/apple/provisioning/data"
  guard let url = URL(string: baseUrl) else {
    completion(nil, NSError(domain: "RNAppleProvisioning", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
    return
  }
  
  var request = URLRequest(url: url)
  request.httpMethod = "POST"
  request.setValue("application/json", forHTTPHeaderField: "Content-Type")
  
  let certificatesStrings = certificates.map { $0.base64EncodedString() }
  let nonceString = nonce.base64EncodedString()
  let nonceSignatureString = nonceSignature.base64EncodedString()
  
  let params: [String: Any] = ["certificates": certificatesStrings, "nonce": nonceString, "nonceSignature": nonceSignatureString]
  let postData: [String: Any] = ["params": params, "token": cardRequest.token, "id": cardRequest.cardId]
  
  do {
    let postDataJSON = try JSONSerialization.data(withJSONObject: postData, options: [])
    request.httpBody = postDataJSON
  } catch {
    completion(nil, error)
    return
  }
  
  let dataTask = URLSession.shared.dataTask(with: request) { data, response, error in
    if let error = error {
      completion(nil, error)
      return
    }
    if let data = data, let responseJSON = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
      completion(responseJSON, nil)
    }
  }
  dataTask.resume()
}

func getUserDefaults() -> UserDefaults? {
  let appGroupID = "group.4CFQ3FG324.com.tonhub.app"
  let appGroupSharedDefaults = UserDefaults(suiteName: appGroupID)
  return appGroupSharedDefaults
}

func getUserDefaultsDict() -> [String: Any] {
  let appGroupSharedDefaults = getUserDefaults()
  let groupUserDefaults = appGroupSharedDefaults?.dictionaryRepresentation() ?? [:]
  return groupUserDefaults
}

func shouldRequireAuthenticationForAppleWallet() -> Bool {
  let appGroupSharedDefaults = getUserDefaultsDict();
  return appGroupSharedDefaults["ShouldRequireAuthenticationForAppleWallet"] as? Bool ?? false
}

func setShouldRequireAuthentication(shouldRequireAuthentication: Bool) {
  let appGroupSharedDefaults = getUserDefaults()
  appGroupSharedDefaults?.set(shouldRequireAuthentication, forKey: "ShouldRequireAuthenticationForAppleWallet")
  appGroupSharedDefaults?.synchronize()
}

func getProvisioningCredentials() -> [ProvisioningCredential] {
  let appGroupSharedDefaults = getUserDefaultsDict()
  let cachedCredentialsData = appGroupSharedDefaults["PaymentPassCredentials"] as? String
  
  var provisioningCredentials = [ProvisioningCredential]()
  
  // try parsing json to creds
  if let data = cachedCredentialsData?.data(using: .utf8) {
    do {
      let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: [String: Any]]
      json?.forEach { (key, credentialDict) in
        let credential = ProvisioningCredential(
          identifier: credentialDict["identifier"] as? String ?? "",
          label: credentialDict["label"] as? String ?? "",
          cardholderName: credentialDict["cardholderName"] as? String ?? "",
          token: credentialDict["token"] as? String ?? "",
          address: credentialDict["address"] as? String ?? "",
          primaryAccountSuffix: credentialDict["primaryAccountSuffix"] as? String ?? "",
          isTestnet: credentialDict["isTestnet"] as? Bool,
          assetName: credentialDict["assetName"] as? String,
          assetUrl: credentialDict["assetUrl"] as? String
        )
        
        provisioningCredentials.append(credential)
      }
    } catch {
      print("Failed to decode credentials from JSON")
    }
  }
  
  return provisioningCredentials
}

func setProvisioningCredentials(credentials: [String: ProvisioningCredential]) {
  let appGroupSharedDefaults = getUserDefaults()
  
  var jsonCompatibleDict = [String: Any]()
  
  for (key, credential) in credentials {
    jsonCompatibleDict[key] = [
      "identifier": credential.identifier,
      "label": credential.label,
      "cardholderName": credential.cardholderName,
      "token": credential.token,
      "address": credential.address,
      "primaryAccountSuffix": credential.primaryAccountSuffix,
      "isTestnet": credential.isTestnet as Any,
      "assetName": credential.assetName as Any,
      "assetUrl": credential.assetUrl as Any
    ]
  }
  
  // dict -> data
  if let jsonData = try? JSONSerialization.data(withJSONObject: jsonCompatibleDict, options: []) {
    let jsonString = String(data: jsonData, encoding: .utf8)
    appGroupSharedDefaults?.set(jsonString, forKey: "PaymentPassCredentials")
    appGroupSharedDefaults?.synchronize()
  } else {
    print("Failed to encode credentials to JSON")
  }
}

@available(iOS 13.4, *)
func getRemoteAccSuffixes() -> Set<String> {
  let library = PKPassLibrary()
  let paymentPassLibrary = library.passes(of: .payment)
  var remotePassIdentifiers = Set<String>()
  
  for pass in paymentPassLibrary {
    if let suff = pass.secureElementPass?.primaryAccountNumberSuffix {
      if pass.isRemotePass && pass.deviceName.localizedCaseInsensitiveContains("Apple Watch") {
        remotePassIdentifiers.insert(suff)
      }
    }
  }
  
  return remotePassIdentifiers
}

@available(iOS 13.4, *)
func getAccSuffixes() -> Set<String> {
  let library = PKPassLibrary()
  let paymentPassLibrary = library.passes(of: .payment)
  var passIdentifiers = Set<String>()
  
  for pass in paymentPassLibrary {
    if let suff = pass.secureElementPass?.primaryAccountNumberSuffix {
      if !pass.isRemotePass {
        passIdentifiers.insert(suff)
      }
    }
  }
  
  return passIdentifiers
}

/**
 *  Dev checks
 */

func dictToJSONString(dict: [String: Any]) -> String? {
  if let jsonData = try? JSONSerialization.data(withJSONObject: dict, options: []) {
    return String(data: jsonData, encoding: .utf8)
  }
  return nil
}

func jsonStringToDict(jsonString: String) -> [String: Any]? {
  if let data = jsonString.data(using: .utf8) {
    return try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
  }
  return nil
}

func storeExtensionDevData(key: String, dict: [String: Any]) {
  let appGroupSharedDefaults = getUserDefaults()
  let dictString = dictToJSONString(dict: dict)
  appGroupSharedDefaults?.set(dictString, forKey: key)
  appGroupSharedDefaults?.synchronize()
}

func getExtensionDevData(key: String) -> String? {
  let appGroupSharedDefaults = getUserDefaults()
  return appGroupSharedDefaults?.object(forKey: key) as? String
}

@available(iOS 14, *)
func paymentPassStatus(completion: @escaping (PKIssuerProvisioningExtensionStatus) -> Void) {
    let watchSession = WatchConnectivitySession()
    let passLibrary = PKPassLibrary()
    let paymentPassLibrary: [PKPass] = passLibrary.passes(of: .secureElement)
    
    // This status will be passed to the completion handler.
    let status = PKIssuerProvisioningExtensionStatus()
    var passSuffixes: Set<String> = []
    var remotePassSuffixes: Set<String> = []
    var availablePassesForIphone: Int = 0
    var availableRemotePassesForAppleWatch: Int = 0
    
    // Get the identifiers of payment passes that are already added
    // to Apple Pay.
    for pass in paymentPassLibrary {
      if let identifier = pass.secureElementPass?.primaryAccountNumberSuffix {
        if pass.isRemotePass && pass.deviceName.localizedCaseInsensitiveContains("Apple Watch") {
          remotePassSuffixes.insert(identifier)
        } else if !pass.isRemotePass {
          passSuffixes.insert(identifier)
        }
      }
    }
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentials = getProvisioningCredentials()
    
    for credential in cachedCredentials {
      if !passSuffixes.contains(credential.primaryAccountSuffix) {
        availablePassesForIphone += 1
      }
      
      if !remotePassSuffixes.contains(credential.primaryAccountSuffix) {
        availableRemotePassesForAppleWatch += 1
      }
    }
    
    // Set the status of the extension.
    status.passEntriesAvailable = availablePassesForIphone > 0
    status.remotePassEntriesAvailable = watchSession.isPaired && availableRemotePassesForAppleWatch > 0
    
    // You can also set requiresAuthentication to "true" or "false"
    // directly, if not wanting to rely on a cached value.
    status.requiresAuthentication = shouldRequireAuthenticationForAppleWallet()
    
    // Invoke the completion handler.
    // The system needs to invoke the handler within 100 ms, or the extension does not display to the user in Apple Wallet.
    completion(status)
  }
