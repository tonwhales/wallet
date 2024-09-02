//
//  WUIExtView.swift
//  WUIExt
//

import SwiftUI
import PassKit

struct PasscodeDotView: View {
  @Binding var isSelected: Bool
  
  @State private var scale: CGFloat = 1.0
  
  var body: some View {
    Circle()
      .fill(isSelected ? Color.accentColor : Color.gray)
      .frame(width: 10, height: 10)
      .scaleEffect(scale)
      .onChange(of: isSelected) { oldValue, newValue in
        if newValue {
          withAnimation(.easeInOut(duration: 0.2)) {
            scale = 1.4
          }
          withAnimation(.easeInOut(duration: 0.2).delay(0.2)) {
            scale = 1.0
          }
        }
      }
  }
}

// TODO:
// - add support dark/light modes
// - translations

struct WUIExtView: View {
  var completionHandler: ((PKIssuerProvisioningExtensionAuthorizationResult) -> Void)?
  @State private var passcode: String = ""
  
  static let accent = Color(red: 86 / 255, green: 76 / 255, blue: 226 / 255)
  static let accentDark = Color(red: 94 / 255, green: 84 / 255, blue: 242 / 255)
  
  // TODO implement
  func handleLogin() -> Void {
    // Create username/password login logic.
    // You can copy and reuse the username/password
    // login logic from the containing issuer app.
    let randomNum = Int.random(in: 1..<10)
    let authorized = randomNum > 5 ? true : false
    
    // Call the completion handler
    if authorized {
      completionHandler!(.authorized)
    } else {
      completionHandler!(.canceled)
    }
  }
  
  // TODO implement
  func handleBiometricLogin() -> Void {
    // Create biometric login logic.
    // You can copy and reuse the biometric
    // login logic from the containing issuer app.
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
    VStack {
      Spacer()
      titleView
      passcodeDotsView
      Spacer()
      pinPadView
    }
  }
  
  private var titleView: some View {
    Text("Enter your PIN code")
      .font(.title)
      .padding()
  }
  
  private var passcodeDotsView: some View {
    HStack {
      ForEach(0..<6) { index in
        PasscodeDotView(isSelected: .constant(index < passcode.count))
      }
    }
  }
  
  private func createButton(row: Int, column: Int) -> some View {
    Button(action: {
      if (passcode.count < 6) {
        passcode += "\(row * 3 + column + 1)"
      }
    }) {
      Text("\(row * 3 + column + 1)")
        .font(.title)
        .foregroundStyle(.black)
        .padding()
    }
  }
  
  private func createRow(row: Int) -> some View {
    HStack(spacing: 60) {
      ForEach(0..<3) { column in
        createButton(row: row, column: column)
      }
    }
  }
  
  private func deleteButton() -> some View {
    Button(action: {
      if passcode.count > 0 {
        passcode.removeLast()
      }
    }) {
      Image(systemName: "delete.left")
        .foregroundStyle(.gray)
        .font(.title)
        .padding()
    }
  }
  
  private func faceIdButton() -> some View {
    Button(action: handleBiometricLogin) {
      Image(systemName: "faceid")
        .font(.title)
        .foregroundStyle(.gray)
        .padding()
    }
  }
  
  private var pinPadView: some View {
    VStack(spacing: 20) {
      ForEach(0..<3) { row in
        createRow(row: row)
      }
      HStack(spacing: 50) {
        faceIdButton()
        createButton(row: 0, column: -1)
        deleteButton()
      }
    }
  }
}
