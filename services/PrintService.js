import {BluetoothManager,BluetoothEscposPrinter,BluetoothTscPrinter} from 'react-native-bluetooth-escpos-printer';

BluetoothManager.isBluetoothEnabled().then((enabled)=> {
    console.log(enabled) // enabled ==> true /false
}, (err)=> {
    console.log(err)
});

export const PrintService = {
  connectPrinter: async () => {
    try {
      const devices = await BluetoothEscposPrinter.scanDevices();
      const pairedDevices = devices.filter(device => device.paired);
      if (pairedDevices.length === 0) {
        throw new Error('No paired printers found');
      }
      return pairedDevices[0];
    } catch (error) {
      throw new Error(`Failed to connect: ${error.message}`);
    }
  },

  printReceipt: async (receiptData) => {
    try {
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      
      // Print Header
      await BluetoothEscposPrinter.printText("RUKUNDO EGUMEHO TRANSPORTERS\n\n", {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      
      // Print Contact Info
      await BluetoothEscposPrinter.printText("+256 762076555 | +256 772169814\n", {});
      await BluetoothEscposPrinter.printText("Kagafi Taxi Park\n", {});
      await BluetoothEscposPrinter.printText("Plot 63 Kagadi\n\n", {});
      
      // Print Receipt Details
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Client: ${receiptData.clientName}\n`, {});
      await BluetoothEscposPrinter.printText(`Ticket ID: ${receiptData.ticketId}\n`, {});
      await BluetoothEscposPrinter.printText(`Phone: ${receiptData.phoneNumber}\n`, {});
      await BluetoothEscposPrinter.printText(`From: ${receiptData.from?.name}\n`, {});
      await BluetoothEscposPrinter.printText(`To: ${receiptData.to?.name}\n`, {});
      await BluetoothEscposPrinter.printText(`Amount: UGX ${receiptData.amountPaid}\n`, {});
      await BluetoothEscposPrinter.printText(`Status: ${receiptData.paymentStatus?.name}\n`, {});
      await BluetoothEscposPrinter.printText(`Date: ${receiptData.date}\n`, {});
      
      // Print Footer
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText("Thank you for travelling with us!\n\n\n", {});
      
      return true;
    } catch (error) {
      throw new Error(`Printing failed: ${error.message}`);
    }
  }
};