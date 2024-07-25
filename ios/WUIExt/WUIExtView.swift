//
//  WUIExtView.swift
//  WUIExt
//
//  Created by VZ on 25/7/24.
//

import SwiftUI
import PassKit

struct WUIExtView: View {
  var completionHandler: ((PKIssuerProvisioningExtensionAuthorizationResult) -> Void)?
  
  func handleLogin() -> Void {
    // Create username/password login logic.
    // You can copy and reuse the username/password
    // login logic from the containing issuer app.
    print("Log In button tapped")
    let randomNum = Int.random(in: 1..<10)
    let authorized = randomNum > 5 ? true : false
    
    // Call the completion handler
    if authorized {
      completionHandler!(.authorized)
    } else {
      completionHandler!(.canceled)
    }
  }
  
  func handleBiometricLogin() -> Void {
    // Create biometric login logic.
    // You can copy and reuse the biometric
    // login logic from the containing issuer app.
    print("Face ID button tapped")
    let randomNum = Int.random(in: 1..<10)
    let authorized = randomNum > 5 ? true : false
    
    // Call the completion handler
    if authorized {
      completionHandler!(.authorized)
    } else {
      completionHandler!(.canceled)
    }
  }
  
  var body: some View {
    // Add SwiftUI code for the login view. You can copy the
    // code logic from the containing issuer app's login view,
    // then place the code logic within this UI extension view.
    
    VStack {
      let smallConfig = UIImage.SymbolConfiguration(pointSize: 50, weight: .bold, scale: .small)
      if let banknoteLogo = UIImage(systemName: "banknote.fill", withConfiguration: smallConfig) {
        Image(uiImage: banknoteLogo.withRenderingMode(.alwaysTemplate))
          .foregroundColor(.white)
          .padding([.bottom], 10)
      }
      Text("Issuer App")
        .font(.title)
        .bold()
        .padding([.bottom], 20)
        .foregroundColor(.white)
      
      List {
        . . .
        
        HStack(spacing: 18) {
          Spacer()
          Button(
            action: handleBiometricLogin,
            label: {
              HStack {
                Image(systemName: "faceid")
                Text("Face ID")
                  .bold()
                  .font(.system(size: 16.0))
              }
              .padding(6)
            }
          )
          .buttonStyle(.bordered)
          .background(Color.blue)
          .cornerRadius(26)
          .foregroundColor(.white)
          Button(
            action: handleLogin,
            label: {
              Text("Log In")
                .bold()
                .font(.system(size: 16.0))
                .padding(6)
                .frame(width: 70)
            })
          .buttonStyle(.bordered)
          .background(Color.orange)
          .cornerRadius(26)
          .foregroundColor(.white)
        }
        .listRowBackground(Color.clear)
      }
      
      //. . .
    }
    .background(Color.blue)
  }
}

#Preview {
  WUIExtView()
}
