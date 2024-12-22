# **Documentation for Bus Ticket App using Expo (React Native)**

## **Introduction**
This documentation outlines the development of a mobile application using Expo (React Native framework) to generate and print bus ticket receipts. The app allows users to input details, generate a receipt, and print it using a Bluetooth thermal printer.

---

## **Features**
1. **User Input Form**:
   - Collects data like client name, ticket ID, phone number, travel details, payment type, and amount paid.
2. **Receipt Generation**:
   - Creates a PDF or formatted receipt layout for preview.
3. **Printing Capability**:
   - Integrates with Bluetooth thermal printers to print receipts.
4. **Additional Features** (Optional):
   - QR code generation for ticket validation.
   - Offline data storage.

---

## **Tools and Technologies**

### **Development Tools**
- **Expo**: Framework for building React Native apps with minimal setup.
- **Node.js**: JavaScript runtime for managing dependencies.
- **Expo Go**: For testing the app on physical devices.
- **VS Code**: Code editor.

### **Libraries and Packages**
1. **Form Inputs**: `@react-native-paper`
2. **PDF Generation**: `expo-print`, `expo-sharing`
3. **Printer Integration**: `react-native-bluetooth-escpos-printer`
4. **QR Code Generation**: `react-native-qrcode-svg`
5. **State Management**: `react-redux` (optional for complex state management)

---

## **Project Setup**

### **1. Install Expo CLI**
Install the Expo CLI globally:
```bash
npm install -g expo-cli
```

### **2. Create the Project**
Create a new Expo project:
```bash
expo init BusTicketApp
cd BusTicketApp
```

### **3. Install Required Libraries**
Install the necessary libraries:
```bash
expo install react-native-paper expo-print expo-sharing react-native-qrcode-svg
npm install react-native-bluetooth-escpos-printer
```

---

## **App Development**

### **1. User Input Form**
Create a form to collect user data.

#### **Code Example:**
```jsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';

const App = () => {
  const [clientName, setClientName] = useState('');
  const [ticketID, setTicketID] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Client Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Client Name"
        value={clientName}
        onChangeText={setClientName}
      />

      <Text style={styles.label}>Ticket ID:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Ticket ID"
        value={ticketID}
        onChangeText={setTicketID}
      />

      <Text style={styles.label}>Phone Number:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

      <Button title="Generate Receipt" onPress={() => console.log("Receipt Generated")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontSize: 16, marginVertical: 5 },
  input: { borderWidth: 1, padding: 10, marginBottom: 15 },
});

export default App;
```

---

### **2. Receipt Generation**
Use the **expo-print** and **expo-sharing** libraries to generate and share receipts in PDF format.

#### **Code Example:**
```jsx
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const generatePDF = async (details) => {
  const htmlContent = `
    <h1>Bus Ticket</h1>
    <p>Client Name: ${details.clientName}</p>
    <p>Ticket ID: ${details.ticketID}</p>
    <p>Phone Number: ${details.phoneNumber}</p>
    <p>Amount Paid: UGX 35,000</p>
  `;

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  console.log('PDF generated:', uri);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
};
```

Call `generatePDF(details)` with the user input when the "Generate Receipt" button is pressed.

---

### **3. Printer Integration**
Use the **react-native-bluetooth-escpos-printer** library for printing receipts via Bluetooth.

#### **Setup Example:**
```jsx
import BluetoothEscposPrinter from 'react-native-bluetooth-escpos-printer';

const printReceipt = async (details) => {
  try {
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`Bus Ticket\n\n`, {});
    await BluetoothEscposPrinter.printText(`Client Name: ${details.clientName}\n`, {});
    await BluetoothEscposPrinter.printText(`Ticket ID: ${details.ticketID}\n`, {});
    await BluetoothEscposPrinter.printText(`Amount Paid: UGX 35,000\n`, {});
    await BluetoothEscposPrinter.printText(`\nThank you for travelling with us!\n`, {});
  } catch (error) {
    console.error('Print error:', error);
  }
};
```

---

## **Testing**
1. Test the app using Expo Go on both Android and iOS devices.
2. Use physical devices to test Bluetooth printer connectivity.
3. Verify the layout and alignment of the generated PDF and printed receipt.

---

## **Deployment**
1. **Expo Build**:
   - Build the app for Android and iOS:
     ```bash
     expo build:android
     expo build:ios
     ```
2. Publish the app to the Expo platform for quick sharing and testing:
   ```bash
   expo publish
   ```

---

## **Future Enhancements**
- Add support for multiple languages.
- Integrate cloud storage for receipt history.
- Include analytics to track ticket sales.
- Enable barcode scanning for ticket validation.

---

## **Conclusion**
This app provides a streamlined solution for generating and printing bus tickets directly from a mobile device. By leveraging Expo, it ensures a faster development cycle, cross-platform compatibility, and efficient performance. Additional features can be easily integrated for extended functionality.

