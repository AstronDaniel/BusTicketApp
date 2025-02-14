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
      await BluetoothEscposPrinter.printText("LINK BUS TICKET\n", {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      
      // Print Contact Info
      await BluetoothEscposPrinter.printText("+256 751206424 | +256 782099992\n", {
        fonttype: 1,
        widthtimes: 0,
        heigthtimes: 0
      });
      await BluetoothEscposPrinter.printText("1st Floor Solar House\n", {
        fonttype: 1,
        widthtimes: 0,
        heigthtimes: 0
      });
      await BluetoothEscposPrinter.printText("Plot 63 Muuteesa I Road Katwe\n", {
        fonttype: 1,
        widthtimes: 0,
        heigthtimes: 0
      });
      await BluetoothEscposPrinter.printText(` ${receiptData.numberPlatePrefix?.toUpperCase() || ''} ${receiptData.numberPlatePostfix?.toUpperCase() || ''}\n`, {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      
      // Print Receipt Details
      console.log('Printing details...');
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Client Name : ${receiptData.clientName || 'N/A'}\n`, {});
      await BluetoothEscposPrinter.printText(`Ticket ID   : ${receiptData.ticketId || 'N/A'}\n`, {});
      await BluetoothEscposPrinter.printText(`Phone No.   : ${receiptData.phoneNumber || 'N/A'}\n`, {});
      await BluetoothEscposPrinter.printText(`Temperature : ${receiptData.temperature || 'N/A'}\n`, {});
      await BluetoothEscposPrinter.printText(`From        : ${receiptData.from || 'N/A'}\n`, {});
      await BluetoothEscposPrinter.printText(`To          : ${receiptData.to || 'N/A'}\n`, {});
      await BluetoothEscposPrinter.printText(`Payment     : ${receiptData.paymentStatus?.name || 'N/A'}\n`, {});
      await BluetoothEscposPrinter.printText(`Printed By  : ${receiptData.printedBy || 'N/A'}\n`, {});
      await BluetoothEscposPrinter.printText(`Travel Date : ${receiptData.date || 'N/A'}\n`, {});
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printText(`Code : ${receiptData.code || 'N/A'}\n`, {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText(`Paid\n UGX ${receiptData.amountPaid || '0'}\n`, {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      
      // Print QR Code
      console.log('Printing QR code...');
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER); 
     
      await BluetoothEscposPrinter.printText("Visit link below to review Terms and\nConditions:\n", {
        fonttype: 1,
        widthtimes: 0,
        heigthtimes: 0     });
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printText("www.link.co.ug/terms-of-service.php\n", {
        fonttype: 1,
        widthtimes: 0,
        heigthtimes: 0
      });
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      await BluetoothEscposPrinter.printText("Thank you for travelling with us\n", {
        fonttype: 1,
        widthtimes: 0,
        heigthtimes: 0
      });
      await BluetoothEscposPrinter.printQRCode(`TICKET:${receiptData.ticketId || ''}`, 400, BluetoothEscposPrinter.ERROR_CORRECTION.L);
      
      return true;
    } catch (error) {
      console.error('Printing error:', error);
      throw new Error(`Printing failed: ${error.message}`);
    }
  }
};

export default PrintService;