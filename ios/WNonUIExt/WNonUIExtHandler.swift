//
//  WNonUIExtHandler.swift
//  WNonUIExt
//

import Foundation
import PassKit
import WatchConnectivity

class WNonUIExtHandler: PKIssuerProvisioningExtensionHandler {
  let passLibrary = PKPassLibrary()
  let watchSession = WatchConnectivitySession.shared
  let defaultArt = getDefaultEntryArt()
  
  public func hasPairedWatchDevices() -> Bool {
    guard WCSession.isSupported() else { return false }
    let session = WCSession.default
    return session.isPaired
  }
  
  /**
   Sets the status of the extension to indicate whether a payment pass is available to add and whether
   adding it requires authentication.
   */
  // MARK: Status
  override func status() async -> PKIssuerProvisioningExtensionStatus {
    clearExtensionDevData(key: "WNonUIExtHandler")

    let status = await paymentPassStatus(passLibrary: passLibrary)
    
    storeExtensionDevDataByKey(mainKey: "WNonUIExtHandler", key: "passEntriesAvailable", value: "\(status.passEntriesAvailable)")
    storeExtensionDevDataByKey(mainKey: "WNonUIExtHandler", key: "remotePassEntriesAvailable", value: "\(status.remotePassEntriesAvailable)")
    storeExtensionDevDataByKey(mainKey: "WNonUIExtHandler", key: "requiresAuthentication", value: "\(status.requiresAuthentication)")
    
    return status
  }
  
  // MARK: PassEntries iPhone
  // gather and return a list of payment pass entries that can be added to Apple Pay for iPhone
  override func passEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    let accs = getAccs(library: passLibrary)

    storeExtensionDevDataByKey(mainKey: "WNonUIExtHandler", key: "accs", value: "\(accs.count)")
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentialsData = getProvisioningCredentials(passLibrary: passLibrary)

    storeExtensionDevDataByKey(mainKey: "WNonUIExtHandler", key: "cachedCredentialsData", value: "\(cachedCredentialsData.count)")
    
    let eligibleCredentials = cachedCredentialsData.filter { credential in
      return accs.contains(where: { acc in
        if (acc.suffix == credential.primaryAccountSuffix) {
          return false
        }
        
        return acc.identifier != credential.identifier
      })
    }
    
    // Create a payment pass entry for each credential.
    var entries: [PKIssuerProvisioningExtensionPaymentPassEntry] = []
    
    for credential in eligibleCredentials {
      createPaymentPassEntry(provisioningCredential: credential) { entry in
        if let entry = entry {
          entries.append(entry)
        }
      }
    }
    
    completion(entries)
  }
  
  // MARK: PassEntries Watch
  override func remotePassEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    let remoteAccs = getRemoteAccs(library: passLibrary)
    
    storeExtensionDevDataByKey(mainKey: "WNonUIExtHandler", key: "remoteAccs", value: "\(remoteAccs.count)")
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentialsData = getProvisioningCredentials(passLibrary: passLibrary)
    
    storeExtensionDevDataByKey(mainKey: "WNonUIExtHandler", key: "cachedCredentialsData", value: "\(cachedCredentialsData.count)")
    
    // filter by suffix and identifier
    let eligibleCredentials = cachedCredentialsData.filter { credential in
      return remoteAccs.contains(where: { acc in
        if (acc.suffix == credential.primaryAccountSuffix) {
          return false
        }
        
        return acc.identifier != credential.identifier
      })
    }
    
    // Create a payment pass entry for each credential.
    var entries: [PKIssuerProvisioningExtensionPaymentPassEntry] = []
    
    for credential in eligibleCredentials {
      createPaymentPassEntry(provisioningCredential: credential) { entry in
        if let entry = entry {
          entries.append(entry)
        }
      }
    }

    storeExtensionDevDataByKey(mainKey: "WNonUIExtHandler", key: "remotePassEntries", value: "\(entries.count)")
    
    completion(entries)
  }
  
  // MARK: Payment Pass Request
  override func generateAddPaymentPassRequestForPassEntryWithIdentifier(_ identifier: String, configuration: PKAddPaymentPassRequestConfiguration,
                                                                        certificateChain certificates: [Data], nonce: Data, nonceSignature: Data,
                                                                        completionHandler completion: @escaping (PKAddPaymentPassRequest?) ->
                                                                        Void) {
    // get token from shared defaults with indentifier
    let entries = getProvisioningCredentials(passLibrary: passLibrary)
    let entry = entries.first(where: { $0.identifier == identifier })
    let token = entry?.token
    let isTest = entry?.isTestnet ?? false
    
    if token == nil {
      completion(nil)
      return
    }
    
    let cardReq = AddCardRequest(cardId: identifier, token: token!, isTestnet: isTest)
    
    sendDataToServerForEncryption(
      cardRequest: cardReq,
      certificates: certificates,
      nonce: nonce,
      nonceSignature: nonceSignature) { response, error in
        guard let response = response, error == nil else {
          completion(nil)
          return
        }
        
        guard let resData = response["data"] as? [String: Any] else {
          completion(nil)
          return
        }
        
        guard let encryptedData = resData["encryptedData"] as? String,
              let activationData = resData["activationData"] as? String,
              let ephemeralPublicKey = resData["ephemeralPublicKey"] as? String else {
          completion(nil)
          return
        }
        
        let addRequest = PKAddPaymentPassRequest()
        addRequest.encryptedPassData = Data(base64Encoded: encryptedData)
        addRequest.activationData = Data(base64Encoded: activationData)
        addRequest.ephemeralPublicKey = Data(base64Encoded: ephemeralPublicKey)
        
        completion(addRequest)
      }
  }
  
  private func downloadImage(from url: URL, completion: @escaping (UIImage?) -> Void) {
    URLSession.shared.dataTask(with: url) { data, response, error in
      guard let data = data, error == nil else {
        print("Error downloading image: \(error?.localizedDescription ?? "Unknown error")")
        completion(nil)
        return
      }
      
      if let image = UIImage(data: data) {
        DispatchQueue.main.async {
          completion(image)
        }
      } else {
        print("Error creating image from data")
        completion(nil)
      }
    }.resume()
  }
  
  private func createPaymentPassEntry(provisioningCredential: ProvisioningCredential, completion: @escaping (PKIssuerProvisioningExtensionPaymentPassEntry?) -> Void) {
    let identifier = provisioningCredential.identifier
    let label = provisioningCredential.label
    
    let requestConfig = PKAddPaymentPassRequestConfiguration(encryptionScheme: .ECC_V2)!
    requestConfig.primaryAccountIdentifier = identifier
    requestConfig.cardholderName = provisioningCredential.cardholderName
    requestConfig.localizedDescription = provisioningCredential.label
    requestConfig.primaryAccountSuffix = provisioningCredential.primaryAccountSuffix
    requestConfig.style = .payment
    
    let entry = PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
                                                              title: label,
                                                              art: defaultArt,
                                                              addRequestConfiguration: requestConfig)!
    
    completion(entry)
    
    // TODO: implement? Supports art from a URL or an asset name.
    // let art = resolvePassEntryArt(provisioningCredential: provisioningCredential) { art in
    //   if (image != nil) {
    //     completion(PKIssuerProvisioningExtensionPaymentPassEntry(identifier: identifier,
    //                                                              title: label,
    //                                                              art: art,
    //                                                              addRequestConfiguration: requestConfig)!)
    //   } else {
    //     completion(nil)
    //   }
    // }
  }
  
  private func resolvePassEntryArt(provisioningCredential: ProvisioningCredential, completion: @escaping (CGImage?) -> Void) {
    if let assetUrl = provisioningCredential.assetUrl, let url = URL(string: assetUrl) {
      downloadImage(from: url) { image in
        if let uiImage = image {
          completion(getEntryArt(image: uiImage))
        } else {
          guard let uiImage = UIImage(named: "card-default") else {
            completion(nil)
            return
          }
          
          completion(getEntryArt(image: uiImage))
        }
      }
    } else if let assetName = provisioningCredential.assetName, let uiImage = UIImage(named: assetName) {
      completion(getEntryArt(image: uiImage))
    } else {
      guard let uiImage = UIImage(named: "card-default") else {
        completion(nil)
        return
      }
      
      completion(getEntryArt(image: uiImage))
    }
  }
  
  private func getPaymentPassEntries(for credentials: [ProvisioningCredential], completion: @escaping ([PKIssuerProvisioningExtensionPaymentPassEntry]) -> Void) {
    let dispatchGroup = DispatchGroup()
    var entries: [PKIssuerProvisioningExtensionPaymentPassEntry] = []
    var errors: [Error] = []
    
    for credential in credentials {
      dispatchGroup.enter()
      
      createPaymentPassEntry(provisioningCredential: credential) { entry in
        if let entry = entry {
          entries.append(entry)
        } else {
          // Handle the error case if needed
          errors.append(NSError(domain: "EntryCreationError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to create entry for credential: \(credential.identifier)"]))
        }
        dispatchGroup.leave()
      }
    }
    
    dispatchGroup.notify(queue: .main) {
      if errors.isEmpty {
        completion(entries)
      } else {
        // Handle errors if needed
        _ = errors.map { $0.localizedDescription }.joined(separator: ", ")
        completion(entries)
      }
    }
  }
}
