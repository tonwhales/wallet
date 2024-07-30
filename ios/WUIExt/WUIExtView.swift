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
    // SwiftUi screen containing a title, description, entered passcode dots, pin pad buttons and a Face ID button
    VStack {
      Text("Log In")
        .font(.title)
        .padding()
      
      Text("Enter your passcode")
        .font(.subheadline)
        .padding()
      
      HStack {
        ForEach(0..<6) { index in
          Circle()
            .frame(width: 10, height: 10)
            .foregroundColor(.black)
            .padding()
        }
      }
      
      VStack {
        ForEach(0..<3) { row in
          HStack {
            ForEach(0..<3) { column in
              Button(action: {
                print("Button \(row * 3 + column + 1) tapped")
              }) {
                Text("\(row * 3 + column + 1)")
                  .font(.title)
                  .padding()
              }
            }
          }
        }
        
        HStack {
          Button(action: {
            print("Button 0 tapped")
          }) {
            Text("0")
              .font(.title)
              .padding()
          }
          
          Button(action: {
            print("Delete button tapped")
          }) {
            Image(systemName: "delete.left")
              .font(.title)
              .padding()
          }
        }
      }
      
      Button(action: handleBiometricLogin) {
        Text("Face ID")
          .font(.title)
          .padding()
      }
    }
  }
}