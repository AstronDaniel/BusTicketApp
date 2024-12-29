import {BluetoothManager, BluetoothEscposPrinter} from 'react-native-bluetooth-escpos-printer';

const PrintService = {
  connectPrinter: async () => {
    try {
      console.log('Scanning for devices...');
      
      // Check currently paired devices
      const paired = await BluetoothManager.enableBluetooth();
      console.log('Currently paired devices:', paired);
      
      // Start scanning for devices
      console.log('Starting device scan...');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Short delay before scanning
      
      const foundDevices = await BluetoothManager.scanDevices();
      console.log('Found devices:', foundDevices);
      
      let devices = [];
      if (typeof foundDevices === 'object') {
        devices = Object.values(foundDevices)
          .filter(device => device.name && device.address)
          .map(device => ({
            name: device.name,
            address: device.address,
          }));
      }
      
      console.log('Available printers:', devices);
      
      if (devices.length === 0) {
        throw new Error('No Bluetooth printers found');
      }
 
      // Try to connect to the first printer found
      const firstPrinter = devices[0];
      console.log('Attempting to connect to:', firstPrinter);
      
      const connected = await BluetoothManager.connect(firstPrinter.address);
      console.log('Connection result:', connected);
      
      if (!connected) {
        throw new Error('Failed to connect to printer');
      }

      return firstPrinter;
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
      await BluetoothEscposPrinter.printText("Kagafi Taxi Park\n", {});
      await BluetoothEscposPrinter.printText("Plot 63 Kagadi\n\n", {});
      
      // Print Receipt Details
      console.log('Printing details...');
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