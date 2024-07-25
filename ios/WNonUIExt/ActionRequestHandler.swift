//
//  ActionRequestHandler.swift
//  WNonUIExt
//
//  Created by VZ on 25/7/24.
//

import Foundation
import PassKit

class Logger {
  static let shared = Logger()
  
  func error(_ message: String) {
    print("Error: \(message)")
  }
  
  func warning(_ message: String) {
    print("Warning: \(message)")
  }
}

enum PaymentNetwork: String, Codable {
  case visa = "Visa"
  case masterCard = "MasterCard"
}


// MARK: Structs
struct ProvisioningCredential: Codable {
  let identifier: String
  let label: String
  let cardholderName: String
  let localizedDescription: String?
  let primaryAccountSuffix: String
  let expiration: String?
  let assetName: String?
  let cryptoAddress: String?
  let paymentNetwork: PaymentNetwork?
  let token: String
}

// EncryptedPassDataResponse
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

// MARK: Handler

class ActionRequestHandler: PKIssuerProvisioningExtensionHandler {
  let log = Logger.shared
  let passLibrary = PKPassLibrary()
  let watchSession = WatchConnectivitySession()
  
  /**
   Sets the status of the extension to indicate whether a payment pass is available to add and whether
   adding it requires authentication.
   */
  // MARK: - Status
  override func status(completion: @escaping (PKIssuerProvisioningExtensionStatus) -> Void) {
    
    // This status will be passed to the completion handler.
    let status = PKIssuerProvisioningExtensionStatus()
    var paymentPassLibrary: [PKPass] = []
    var passIdentifiers: Set<String> = []
    var remotePassIdentifiers: Set<String> = []
    var availablePassesForIphone: Int = 0
    var availableRemotePassesForAppleWatch: Int = 0
    
    // Get the identifiers of payment passes that are already added
    // to Apple Pay.
    paymentPassLibrary = self.passLibrary.passes(of: .secureElement)
    
    for pass in paymentPassLibrary {
      if let identifier = pass.secureElementPass?.primaryAccountIdentifier {
        if pass.isRemotePass && pass.deviceName.localizedCaseInsensitiveContains("Apple Watch") {
          remotePassIdentifiers.insert(identifier)
        } else if !pass.isRemotePass {
          passIdentifiers.insert(identifier)
        }
      }
    }
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    if let cachedCredentialsData = appGroupSharedDefaults.data(forKey: "PaymentPassCredentials") {
      
      // JSON decode the cached credential data of all of the user's
      // issued cards.
      //
      //       Note: ProvisioningCredential is not a member of PassKit.
      //       You should modify this logic based on how the issuer app
      //       structures persisted data of an issued card.
      if let decoded = try? JSONDecoder().decode([String: ProvisioningCredential].self, from: cachedCredentialsData) {
        for identifier in decoded.keys {
          
          // Count number of passes available to add to iPhone
          if !passIdentifiers.contains(identifier) {
            availablePassesForIphone += 1
          }
          
          // Count number of passes available to add to Apple Watch
          if !remotePassIdentifiers.contains(identifier) {
            availableRemotePassesForAppleWatch += 1
          }
        }
      } else {
        log.error("Error occurred while JSON decoding cachedCredentialsData")
      }
    } else {
      log.warning("Unable to find credentials of passes available to add to Apple Pay.")
    }
    
    // Set the status of the extension.
    status.passEntriesAvailable = availablePassesForIphone > 0
    status.remotePassEntriesAvailable = watchSession.isPaired && availableRemotePassesForAppleWatch > 0
    
    // You can also set requiresAuthentication to "true" or "false"
    // directly, if not wanting to rely on a cached value.
    status.requiresAuthentication = appGroupSharedDefaults.bool(forKey: "ShouldRequireAuthenticationForAppleWallet")
    
    // Invoke the completion handler.
    // The system needs to invoke the handler within 100 ms, or the extension does not display to the user in Apple Wallet.
    completion(status)
  }
  
  // MARK: - PassEntries
  // gather and return a list of payment pass entries that can be added to Apple Pay
  override func passEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    
    // This list will be passed to the completion handler.
    var passEntries: [PKIssuerProvisioningExtensionPassEntry] = []
    var paymentPassLibrary: [PKPass] = []
    var passLibraryIdentifiers: Set<String> = []
    
    // Get the identifiers of payment passes that are already added
    // to Apple Pay.
    paymentPassLibrary = self.passLibrary.passes(of: .secureElement)
    
    for pass in paymentPassLibrary {
      if !pass.isRemotePass, let identifier = pass.secureElementPass?.primaryAccountIdentifier {
        passLibraryIdentifiers.insert(identifier)
      }
    }
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentialsData = getProvisioningCredentials()
    
    // Create a payment pass entry for each credential.
    for credential in cachedCredentialsData {
      if !passLibraryIdentifiers.contains(credential.identifier) {
        passEntries.append(getPaymentPassEntry(provisioningCredential: credential))
      }
    }
    
    // Invoke the completion handler.
    completion(passEntries)
  }
  
  // MARK: - Get Pass Data
  
  func sendDataToServerForEncryption(
    userToken: String,
    cardId: String,
    isTest: Bool,
    params: EncryptedPassDataRequest,
    completion: @escaping (Dictionary<String, Any>?, Error?) -> Void) {
      
      let base = isTest ? "https://card-staging.whales-api.com" : "https://card-prod.whales-api.com"
      let baseUrl = "\(base)/v2/card/get/apple/provisioning/data"
      guard let url = URL(string: baseUrl) else {
        completion(nil, NSError(domain: "URLCreationError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
        return
      }
      
      var request = URLRequest(url: url)
      request.httpMethod = "POST"
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      
      // array of base64 strings of certificates
      let certificatesStrings = params.certificates
      let nonceString = params.nonce
      let nonceSignatureString = params.nonceSignature
      
      let params: [String: Any] = ["certificates": certificatesStrings,
                                   "nonce": nonceString,
                                   "nonceSignature": nonceSignatureString]
      
      let postData: [String: Any] = ["params": params,
                                     "token": userToken,
                                     "id": cardId]
      
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
        
        if let data = data {
          do {
            if let responseJSON = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
              completion(responseJSON, nil)
            } else {
              completion(nil, NSError(domain: "ResponseError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response format"]))
            }
          } catch {
            completion(nil, error)
          }
        }
      }
      dataTask.resume()
    }
  
  // MARK: - Payment Pass Request
  
  override func generateAddPaymentPassRequestForPassEntryWithIdentifier(_ identifier: String, configuration: PKAddPaymentPassRequestConfiguration,
                                                                        certificateChain certificates: [Data], nonce: Data, nonceSignature: Data,
                                                                        completionHandler completion: @escaping (PKAddPaymentPassRequest?) ->
                                                                        Void) {
    
    // This request object will be passed to the completion handler.
    let request = PKAddPaymentPassRequest()
    
    // Generate the encrypted pass data.
    //
    // EncryptedPassDataResponse and PassResource are not members of
    // PassKit. You should modify this logic based on how the issuer app
    // retrieves the required encrypted pass data from the issuer server.
    //
    // You can use the array.first(where:) method to retrieve a
    // specific PKLabeledValue card detail from a configuration.
    // configuration.cardDetails.first(where: { $0.label == "expiration" })!
    
    // get token from shared defaults with indentifier
    let entries = getProvisioningCredentials()
    let entry = entries.first(where: { $0.identifier == identifier })
    let token = entry?.token

    if token == nil {
      log.error("Token not found for identifier: \(identifier)")
      completion(nil)
      return
    }

    // construct completion handler
        // Insert the encrypted pass data into the PKAddPaymentPassRequest.
        // request.activationData = passData.activationData
        // request.encryptedPassData = passData.encryptedPassData
        // request.ephemeralPublicKey = passData.ephemeralPublicKey
        
        // Invoke the completion handler.
        // completion(request)
    
    sendDataToServerForEncryption(
        userToken: token!,
        cardId: identifier,
        isTest: false,
        params: EncryptedPassDataRequest(certificates: certificates.map { $0.base64EncodedString() },
                                         nonce: nonce.base64EncodedString(),
                                         nonceSignature: nonceSignature.base64EncodedString())
                                         // completion handler goes here
    )
  }
  
  // MARK: - Private Methods
  
  // Returns an array of ProvisioningCredential from the user's defaults database.
  private func getProvisioningCredentials() -> [ProvisioningCredential] {
    var provisioningCredentials: [ProvisioningCredential] = []
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    if let cachedCredentialsData = appGroupSharedDefaults.data(forKey: "PaymentPassCredentials") {
      
      // JSON decode the cached credential data of all of the user's
      // issued cards.
      //
      // Note: ProvisioningCredential is not a member of PassKit.
      // You should modify this logic based on how the issuer app
      // structures persisted data of an issued card.
      if let decoded = try? JSONDecoder().decode([String: ProvisioningCredential].self, from: cachedCredentialsData) {
        provisioningCredentials = Array(decoded.values)
      } else {
        log.error("Error occurred while JSON decoding cachedCredentialsData")
      }
    } else {
      log.warning("Unable to find credentials of passes available to add to Apple Pay.")
    }
    
    return provisioningCredentials
  }
  
  // Returns a payment pass entry.
  private func getPaymentPassEntry(provisioningCredential: ProvisioningCredential) -> PKIssuerProvisioningExtensionPaymentPassEntry {
    
    // If using PNO Payment Data Configuration 1 (FPAN) or 3 (eFPAN), set
    // the identifier as the primaryAccountNumber. If using PNO Payment Data
    // Configuration 2 (FPANID), set the identifier as the
    // primaryAccountIdentifier.
    let identifier = provisioningCredential.identifier
    let label = provisioningCredential.label
    
    // Create a request configuration for adding a payment pass, which will
    // be included in the payment pass entry.
    let requestConfig = PKAddPaymentPassRequestConfiguration(encryptionScheme: .ECC_V2)!
    requestConfig.primaryAccountIdentifier = identifier
    if (provisioningCredential.paymentNetwork != nil) {
      requestConfig.paymentNetwork = provisioningCredential.paymentNetwork! == .visa ? .visa : .masterCard
    }
    requestConfig.cardholderName = provisioningCredential.cardholderName
    requestConfig.localizedDescription = provisioningCredential.localizedDescription
    requestConfig.primaryAccountSuffix = provisioningCredential.primaryAccountSuffix
    requestConfig.style = .payment
    
    // Append additional card details. The value of the expiration label
    // should be a string in the following format: "11/18".
    // requestConfig.cardDetails.append(PKLabeledValue(label: "expiration", value: provisioningCredential.expiration))
    
    // Instantiate and return a payment pass entry.
    if let uiImage = UIImage(named: provisioningCredential.assetName ?? "") {
      return PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                           title: label,
                                                           art: getEntryArt(image: uiImage),
                                                           addRequestConfiguration: requestConfig)!
    } else {
      return PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                           title: label,
                                                           art: getEntryArt(image: #imageLiteral(resourceName: "generic")),
                                                           addRequestConfiguration: requestConfig)!
    }
  }
  
  // Converts a UIImage to a CGImage.
  private func getEntryArt(image: UIImage) -> CGImage {
    let ciImage = CIImage(image: image)
    let ciContext = CIContext(options: nil)
    return ciContext.createCGImage(ciImage!, from: ciImage!.extent)!
  }
  
  
  override func remotePassEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    
    // Get the identifiers of payment passes that are already added
    // to Apple Pay.
    
    for pass in paymentPassLibrary {
      if pass.isRemotePass, pass.deviceName.localizedCaseInsensitiveContains("Apple Watch"),
         let identifier = pass.secureElementPass?.primaryAccountIdentifier  {
        passLibraryIdentifiers.insert(identifier)
      }
    }
    
    // Invoke the completion handler
    completion(passEntries)
  }
}
