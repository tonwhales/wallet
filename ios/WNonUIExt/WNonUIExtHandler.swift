//
//  WNonUIExtHandler.swift
//  WNonUIExt
//
//  Created by VZ on 25/7/24.
//

import Foundation
import PassKit

class WNonUIExtHandler: PKIssuerProvisioningExtensionHandler {
  let passLibrary = PKPassLibrary()
  let watchSession = WatchConnectivitySession.shared
  let defaultArt = getDefaultEntryArt()
  
  /**
   Sets the status of the extension to indicate whether a payment pass is available to add and whether
   adding it requires authentication.
   */
  // MARK: Status
  override func status(completion: @escaping (PKIssuerProvisioningExtensionStatus) -> Void) {
    paymentPassStatus(passLibrary: passLibrary, watchSession: watchSession) { status in
      // TODO: remove this hack for Apple Watch
      var newStatus = status
      newStatus.remotePassEntriesAvailable = true
      completion(newStatus)
    }
  }
  
  // MARK: PassEntries iPhone
  // gather and return a list of payment pass entries that can be added to Apple Pay for iPhone
  override func passEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    let accs = getAccs(library: passLibrary)
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentialsData = getProvisioningCredentials()
    
    // let eligibleCredentials = cachedCredentialsData.filter { !accs.contains($0.primaryAccountSuffix) }
    
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
    
    // getPaymentPassEntries(for: eligibleCredentials) { entries in
    //   storeExtensionDevData(key: "WNonUIExtHandler-dev-entries", dict: [
    //     "status": "success",
    //     "res": "\(entries.count)"
    //   ])
    //   completion(entries)
    // }
    
    completion(entries)
  }
  
  // MARK: PassEntries Watch
  override func remotePassEntries(completion: @escaping ([PKIssuerProvisioningExtensionPassEntry]) -> Void) {
    let remoteAccs = getRemoteAccs(library: passLibrary)
    
    // Get cached credentials data of all of the user's issued cards,
    // within the issuer app, from the user's defaults database.
    let cachedCredentialsData = getProvisioningCredentials()
    
    // let eligibleCredentials = cachedCredentialsData.filter { !remoteAccs.contains($0.primaryAccountSuffix) }
    
    // filter by suffix and identifier
    let eligibleCredentials = cachedCredentialsData.filter { credential in
      return remoteAccs.contains(where: { acc in
        if (acc.suffix == credential.primaryAccountSuffix) {
          return false
        }
        
        return acc.identifier != credential.identifier
      })
    }
    
    // getPaymentPassEntries(for: eligibleCredentials) { entries in
    //   storeExtensionDevData(key: "WNonUIExtHandler-dev-remote", dict: [
    //     "status": "success",
    //     "res": "\(entries.count)"
    //   ])
    //   completion(entries)
    // }
    
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
  
  // MARK: Payment Pass Request
  override func generateAddPaymentPassRequestForPassEntryWithIdentifier(_ identifier: String, configuration: PKAddPaymentPassRequestConfiguration,
                                                                        certificateChain certificates: [Data], nonce: Data, nonceSignature: Data,
                                                                        completionHandler completion: @escaping (PKAddPaymentPassRequest?) ->
                                                                        Void) {
    // You can use the array.first(where:) method to retrieve a
    // specific PKLabeledValue card detail from a configuration.
    // configuration.cardDetails.first(where: { $0.label == "expiration" })!
    
    //TODO: last 4 digits of the card number (primaryAccountSuffix) ???
    
    // get token from shared defaults with indentifier
    let entries = getProvisioningCredentials()
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
    
    // Supports art from a URL or an asset name.
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
      var currentEntriesStatuesDict = getExtensionDevDataDict(key: "WNonUIExtHandler-dev-entry") as? [String: String] ?? [:]
      currentEntriesStatuesDict[credential.identifier] = "init"
      
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
        let errorsString = errors.map { $0.localizedDescription }.joined(separator: ", ")
        completion(entries)
      }
    }
  }  
}
