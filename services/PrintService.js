import { BluetoothManager, BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';
import { Alert } from 'react-native';
const PrintService = {
  connectPrinter: async (device) => {
    try {
      console.log('Connecting to device:', device);
      
      // Connect to the selected device
      const connected = await BluetoothManager.connect(device.address);
      console.log('Connection result:', connected);
      
      if (!connected) {
        throw new Error('Failed to connect to printer');
      }

      return device;
    } catch (error) {
      console.error('Connection error:', error);
      throw new Error(`Failed to connect: ${error.message}`);
    }
  },

  printReceipt: async (receiptData) => {
    try {
      console.log('Initializing printer...');
      await BluetoothEscposPrinter.printerInit();
      console.log('Setting alignment...');
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      
      // Print Header
      console.log('Printing header...');
      await BluetoothEscposPrinter.printText("LINK BUS TICKET\n\n", {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      
      // Print Contact Info
      await BluetoothEscposPrinter.printText("+256 751206424 | +256 782099992\n", {});
      await BluetoothEscposPrinter.printText("1st Floor Solar House\n", {});
      await BluetoothEscposPrinter.printText("Plot 63 Muteesa I Road Katwe\n", {});
      await BluetoothEscposPrinter.printText(`${receiptData.numberPlatePrefix.toUpperCase()}${" "}${receiptData.numberPlatePostfix.toUpperCase()}\n`, {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      
      // Print Receipt Details
      console.log('Printing details...');
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Client Name : ${receiptData.clientName}\n`, {});
      await BluetoothEscposPrinter.printText(`Ticket ID   : ${receiptData.ticketId.toUpperCase()}\n`, {});
      await BluetoothEscposPrinter.printText(`Phone No.   : ${receiptData.phoneNumber}\n`, {});
      await BluetoothEscposPrinter.printText(`Temperature : ${receiptData.temperature}\n`, {});
      await BluetoothEscposPrinter.printText(`From        : ${receiptData.from}\n`, {});
      await BluetoothEscposPrinter.printText(`To          : ${receiptData.to}\n`, {});
      await BluetoothEscposPrinter.printText(`Payment     : ${receiptData.paymentStatus?.name}\n`, {});
     
      await BluetoothEscposPrinter.printText(`Printed by  : ${receiptData.printedBy}\n\n`, {});
      // await BluetoothEscposPrinter.printText(`Printed on: ${receiptData.date}\n`, {});
      await BluetoothEscposPrinter.printText(`Travel Date : ${receiptData.date}\n`, {});
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printText(`Code : ${receiptData.code}\n`, {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      }); 
         await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER); 
      await BluetoothEscposPrinter.printText(`Paid\nUGX ${receiptData.amountPaid}\n`, {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      

      
      // Print QR Code
      console.log('Printing QR code...');
  
      await BluetoothEscposPrinter.printText("Visit link below to review Terms and Conditions\n", {});
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printText("www.link.co.ug/terms-of-service.php\n", {});
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printText("Thank you for travelling with us\n\n", {});
      await BluetoothEscposPrinter.printQRCode(`TICKET:${receiptData.ticketId}`, 400, BluetoothEscposPrinter.ERROR_CORRECTION.L);
      
      // Print Footer
      // console.log('Printing footer...');
      // await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      // await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      // await BluetoothEscposPrinter.printText("Thank you for travelling with us!\n\n\n", {});
      
      return true;
    } catch (error) {
      console.error('Printing error:', error);
      Alert.alert(`Printing failed: ${error.message}`);
      throw new Error(`Printing failed: ${error.message}`);
    }
  }
};

export default PrintService;