import { BluetoothManager, BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';

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
      await BluetoothEscposPrinter.printText("RUKUNDO EGUMEHO TRANSPORTERS\n\n", {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      
      // Print Contact Info
      await BluetoothEscposPrinter.printText("+256 762076555 | +256 772169814\n", {});
      await BluetoothEscposPrinter.printText("Kagadi Taxi Park\n", {});
      await BluetoothEscposPrinter.printText("Plot 63 Kagadi\n\n", {});
      
      // Print Receipt Details
      console.log('Printing details...');
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Client Name: ${receiptData.clientName}\n`, {});
      await BluetoothEscposPrinter.printText(`Ticket ID: ${receiptData.ticketId}\n`, {});
      await BluetoothEscposPrinter.printText(`Phone No.: ${receiptData.phoneNumber}\n`, {});
      await BluetoothEscposPrinter.printText(`From: ${receiptData.from}\n`, {});
      await BluetoothEscposPrinter.printText(`To: ${receiptData.to}\n`, {});
      await BluetoothEscposPrinter.printText(`Status: ${receiptData.paymentStatus?.name}\n`, {});
      await BluetoothEscposPrinter.printText(`Temperature: ${receiptData.temperature}\n`, {});
      await BluetoothEscposPrinter.printText(`Printed by: ${receiptData.printedBy}\n`, {});
      await BluetoothEscposPrinter.printText(`Printed on: ${receiptData.date}\n`, {});
      await BluetoothEscposPrinter.printText(`Travel Date: ${receiptData.date}\n`, {});
      
      // Print QR Code
      console.log('Printing QR code...');
      await BluetoothEscposPrinter.printQRCode(`TICKET:${receiptData.ticketId}`, 200, BluetoothEscposPrinter.ERROR_CORRECTION.L);
      
      // Print Footer
      console.log('Printing footer...');
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText("Thank you for travelling with us!\n\n\n", {});
      
      return true;
    } catch (error) {
      console.error('Printing error:', error);
      throw new Error(`Printing failed: ${error.message}`);
    }
  }
};

export default PrintService;