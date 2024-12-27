import { BleManager } from 'react-native-ble-plx';
import { Platform } from 'react-native';

const manager = new BleManager();
console.log(manager)
export const printReceipt = async (receiptData, bleManager) => {
  try {
    if (!bleManager) {
      throw new Error('BLE Manager not initialized');
    }
    
    const device = await bleManager.connectToDevice(
      receiptData.printerAddress,
      { autoConnect: true }
    );
    await device.discoverAllServicesAndCharacteristics();
    
    // Format receipt text
    const receiptText = [
      "================================\n",
      "       RUKUNDO EGUMERO         \n",
      "         TRANSPORTERS           \n",
      "================================\n",
      `Client Name: ${receiptData.clientName}\n`,
      `Ticket ID: ${receiptData.ticketId}\n`,
      `Phone No.: ${receiptData.phoneNumber}\n`,
      `From: ${receiptData.from}\n`,
      `To: ${receiptData.to}\n`,
      `Status: ${receiptData.paymentStatus}\n`,
      `Printed by: ${receiptData.staffName}\n`,
      `Printed on: ${receiptData.printedDate}\n`,
      `Travel Date: ${receiptData.travelDate}\n`,
      `Code: ${receiptData.randomCode}\n`,
      `Paid: UGX ${receiptData.amountPaid}\n`,
      "================================\n",
      "Visit link below to review Terms and Conditions:\n",
      "www.link.co.ug/terms-of-service.php\n",
      "Thank you for travelling with us!\n",
      "================================\n\n\n\n"
    ].join('');

    // Write data to characteristic
    await device.writeCharacteristicWithResponseForService(
      'YOUR_SERVICE_UUID',
      'YOUR_CHARACTERISTIC_UUID',
      Buffer.from(receiptText).toString('base64')
    );
    
    await device.cancelConnection();
    return true;
  } catch (error) {
    console.error('Printing error:', error);
    throw error;
  }
};