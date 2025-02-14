import ThermalPrinter from 'react-native-thermal-printer';
import { PermissionsAndroid, Platform } from 'react-native';

// Custom text size multipliers
const TEXT_SIZES = {
  tiny: { width: 1, height: 1 },       // Default size
  small: { width: 1, height: 2 },      // Taller
  medium: { width: 2, height: 2 },     // Double size
  large: { width: 3, height: 3 },      // Triple size
  huge: { width: 4, height: 4 }        // Quadruple size
};

// Default printer configuration
const PRINTER_CONFIG = {
  printerNbrCharactersPerLine: 42,
  printerDpi: 203,
  printerWidthMM: 80,
  mmFeedPaper: 20,
  autoCut: true,
  timeout: 30000
};

const PrintService = {
  // Request Bluetooth permissions for Android
  requestBluetoothPermissions: async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        
        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }
    return true;
  },

  // Helper function to find available Bluetooth printers
  findPrinters: async () => {
    try {
      // Request permissions first
      const hasPermissions = await PrintService.requestBluetoothPermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }

      const devices = await ThermalPrinter.getBluetoothDeviceList();
      console.log('Available Bluetooth devices:', devices);
      return devices;
    } catch (error) {
      console.error('Error finding printers:', error);
      throw new Error(`Failed to find printers: ${error.message}`);
    }
  },

  // Helper function to print text with custom formatting
  printFormattedText: async (text, options = {}) => {
    const { size = 'tiny', ...otherOptions } = options;
    const sizeMultiplier = TEXT_SIZES[size] || TEXT_SIZES.tiny;
    
    const printConfig = {
      ...PRINTER_CONFIG,
      ...otherOptions,
      widthTimes: sizeMultiplier.width,
      heightTimes: sizeMultiplier.height
    };

    try {
      await ThermalPrinter.printBluetooth(text, printConfig);
    } catch (error) {
      console.error('Error printing text:', error);
      throw new Error(`Failed to print text: ${error.message}`);
    }
  },

  // Function to print QR code
  printQR: async (data, options = {}) => {
    const qrConfig = {
      ...PRINTER_CONFIG,
      ...options,
      qrCode: true,
      qrCodeData: data,
      qrCodeSize: options.size || 8
    };

    try {
      await ThermalPrinter.printBluetooth('', qrConfig);
    } catch (error) {
      console.error('Error printing QR code:', error);
      throw new Error(`Failed to print QR code: ${error.message}`);
    }
  },

  // Main receipt printing function
  printReceipt: async (receiptData, selectedPrinter = null) => {
    try {
      // Request permissions and check for available printers
      const printers = await PrintService.findPrinters();
      if (printers.length === 0) {
        throw new Error('No Bluetooth printers found');
      }

      // If a specific printer is selected, verify it's in the list
      if (selectedPrinter) {
        const printerExists = printers.some(p => p.address === selectedPrinter.address);
        if (!printerExists) {
          throw new Error('Selected printer not found');
        }
      }

      // Configure printer
      const printer = selectedPrinter || printers[0];
      const printConfig = {
        ...PRINTER_CONFIG,
        macAddress: printer.address // Set the printer's MAC address
      };

      // Start printing receipt
      console.log('Starting to print receipt...');

      // Print header
      await PrintService.printFormattedText('\n', printConfig);
      
      await PrintService.printFormattedText('LINK BUS TICKET\n', {
        ...printConfig,
        size: 'huge',
        alignment: 'center',
        bold: true
      });
      
      // Contact Info
      await PrintService.printFormattedText([
        '+256 751206424 | +256 782099992\n',
        '1st Floor Solar House\n',
        'Plot 63 Muteesa I Road Katwe\n'
      ].join(''), { 
        ...printConfig,
        size: 'small',
        alignment: 'center' 
      });
      
      // Number Plate
      const numberPlate = receiptData.numberPlatePrefix && receiptData.numberPlatePostfix
        ? `${receiptData.numberPlatePrefix.toUpperCase()} ${receiptData.numberPlatePostfix.toUpperCase()}\n`
        : 'N/A\n';
        
      await PrintService.printFormattedText(numberPlate, { 
        ...printConfig,
        size: 'large',
        alignment: 'center',
        bold: true 
      });
      
      // Separator
      await PrintService.printFormattedText('--------------------------------\n', {
        ...printConfig,
        size: 'small'
      });
      
      // Details
      const details = [
        `Client Name : ${receiptData.clientName || 'N/A'}`,
        `Ticket ID   : ${(receiptData.ticketId || 'N/A').toUpperCase()}`,
        `Phone No.   : ${receiptData.phoneNumber || 'N/A'}`,
        `Temperature : ${receiptData.temperature || 'N/A'}`,
        `From        : ${receiptData.from || 'N/A'}`,
        `To          : ${receiptData.to || 'N/A'}`,
        `Payment     : ${receiptData.paymentStatus?.name || 'N/A'}`,
        `Printed By  : ${receiptData.printedBy || 'N/A'}`,
        `Travel Date : ${receiptData.date || 'N/A'}`
      ];
      
      await PrintService.printFormattedText(details.join('\n') + '\n', {
        ...printConfig,
        size: 'medium'
      });
      
      // Separator
      await PrintService.printFormattedText('--------------------------------\n', {
        ...printConfig,
        size: 'small'
      });
      
      // Code
      await PrintService.printFormattedText(`Code : ${receiptData.code || 'N/A'}\n`, {
        ...printConfig,
        size: 'large',
        alignment: 'center',
        bold: true
      });
      
      // Amount
      await PrintService.printFormattedText('Paid\n', {
        ...printConfig,
        size: 'huge',
        alignment: 'center',
        bold: true
      });
      
      await PrintService.printFormattedText(`UGX ${receiptData.amountPaid || '0'}\n`, {
        ...printConfig,
        size: 'huge',
        alignment: 'center',
        bold: true
      });
      
      // Terms and Conditions
      await PrintService.printFormattedText([
        'Visit link below to review Terms and Conditions\n',
        '--------------------------------\n',
        'www.link.co.ug/terms-of-service.php\n',
        '--------------------------------\n',
        'Thank you for travelling with us\n'
      ].join(''), { 
        ...printConfig,
        size: 'small',
        alignment: 'center' 
      });
      
      // QR Code
      if (receiptData.ticketId) {
        await PrintService.printQR(`TICKET:${receiptData.ticketId}`, {
          ...printConfig,
          alignment: 'center',
          size: 8
        });
      }
      
      // Final spacing
      await PrintService.printFormattedText('\n\n\n', printConfig);
      
      console.log('Receipt printed successfully');
      return true;
    } catch (error) {
      console.error('Receipt printing error:', error);
      throw new Error(`Failed to print receipt: ${error.message}`);
    }
  },

  // Print a test page to verify printer connection and functionality
  printTestPage: async (selectedPrinter = null) => {
    try {
      const printers = await PrintService.findPrinters();
      if (printers.length === 0) {
        throw new Error('No Bluetooth printers found');
      }

      const printer = selectedPrinter || printers[0];
      const printConfig = {
        ...PRINTER_CONFIG,
        macAddress: printer.address
      };

      await PrintService.printFormattedText([
        '\n',
        '=== PRINTER TEST PAGE ===\n\n',
        'Tiny Text (1x1)\n',
        'Small Text (1x2)\n',
        'Medium Text (2x2)\n',
        'Large Text (3x3)\n',
        'Huge Text (4x4)\n',
        '\n=== TEST COMPLETE ===\n\n'
      ].join(''), { ...printConfig, size: 'tiny' });

      return true;
    } catch (error) {
      console.error('Test page printing error:', error);
      throw new Error(`Failed to print test page: ${error.message}`);
    }
  }
};

export default PrintService;