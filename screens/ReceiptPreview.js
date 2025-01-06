import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AuthContext } from "../contexts/AuthContext";
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import PrintService from '../services/PrintService';
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import BluetoothDeviceSelector from '../components/BluetoothDeviceSelector';
import { FontAwesome } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';




const formatAmount = (amount) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
 
const ReceiptPreview = ({ route }) => {
  const { formData } = route.params || {};
  const { user } = useContext(AuthContext);
  const [staffName, setStaffName] = useState('Staff Member');
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [qrRef, setQrRef] = useState(null);
  

 
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${currentDate.getMonth().toString()+ 1}-${currentDate.getDate()}`;
  const formattedTime = `${currentDate.getHours()}:${currentDate.getMinutes()}`;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.email));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setStaffName(userData.firstName + ' ' + userData.lastName);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const requestPermissions = async () => {
    try {
      let permissionsToRequest = [];
      
      if (Platform.OS === 'android') {
        if (Platform.Version >= 31) {
          permissionsToRequest = [
            PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
            PERMISSIONS.ANDROID.BLUETOOTH_SCAN
          ];
        } else { 
          permissionsToRequest = [
            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION
          ];
        }
      }

      const isEnabled = await BluetoothManager.isBluetoothEnabled();
      
      if (!isEnabled) {
        Alert.alert('Bluetooth Required', 'Please enable Bluetooth to print receipts');
        return false;
      }

      const results = await Promise.all(
        permissionsToRequest.map(async (permission) => {
          const result = await check(permission);
          
          if (result === RESULTS.DENIED) {
            const requestResult = await request(permission);
            return requestResult;
          }
          
          return result;
        })
      );
      
      const allGranted = results.every(
        result => result === RESULTS.GRANTED
      );

      return allGranted;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  };

  const getQRCodeBase64 = async () => {
    return new Promise((resolve, reject) => {
      if (qrRef) {
        qrRef.toDataURL((data) => {
          resolve(data);
        });
      } else {
        reject(new Error('QR Code reference not available'));
      }
    });
  };

  const handlePrint = async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permission Denied', 
          'Please grant the required permissions in your device settings to print receipts'
        );
        return;
      }

      setShowDeviceSelector(true);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', error.message);
    }
  };
 
  const handleDeviceSelected = async (device) => {
    setShowDeviceSelector(false);
    try {
      await PrintService.connectPrinter(device);
      
      const receiptData = {
        ...formData,
        date: `${formattedDate} ${formattedTime}`,
        amountPaid: formatAmount(formData.amountPaid),
       
      };
      
      await PrintService.printReceipt(receiptData);
      Alert.alert('Success', 'Receipt printed successfully!');
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      let qrBase64;
      try {
        qrBase64 = await getQRCodeBase64();
      } catch (error) {
        console.error('QR Code generation error:', error);
        qrBase64 = '';
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .container {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow:0 2px 5px #eee;
            }
            .title {
              font-size: 30px;
              font-weight: bold;
              color: #2563eb;
              text-align: center;
              margin-bottom: 16px;
            }
            .header-info {
              text-align: center;
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 4px;
            }
            .location {
              font-size: 29px;
              font-weight: 600;
              text-align: center;
              margin: 16px 0;
            }
            .divider {
              border-top: 2px dotted #e5e7eb;
              margin: 16px 0;
            }
            .info-row {
              font-size: 16px;
              color: #4b5563;
              margin-bottom: 10px;
              padding-bottom: 10px;
            }
            .code {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .amount {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .footer {
              text-align: center;
              color: #4b5563;
              font-size: 16px;
              margin-top: 16px;
            }
            .qr-container {
              text-align: center;
              margin-top: 20px;
            }
            .qr-code {
              width: 128px;
              height: 128px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="title">LINK BUS TICKET</div>
            
            <div class="header-info">+256 751206424 | +256 782099992</div>
            <div class="header-info">1st Floor Solar House</div>
            <div class="header-info">Plot 63 Muuteesa I Road Katwe</div>
            
            <div class="location">${formData.numberPlatePrefix.toUpperCase()}  ${' '} ${formData.numberPlatePostfix.toUpperCase()}</div>
            
            <div class="divider"></div>
            
            <div class="info-row">Client Name: ${formData.clientName}</div>
            <div class="info-row">Ticket ID: ${formData.ticketId}</div>
            <div class="info-row">Phone No.: ${formData.phoneNumber}</div>
            <div class="info-row">Temperature: ${formData.temperature}</div>
            <div class="info-row">From: ${formData.from}</div>
            <div class="info-row">To: ${formData.to}</div>
            <div class="info-row">Payment: ${formData.paymentStatus?.name}</div>
            
            <div class="info-row">Printed by: ${formData.printedBy || staffName}</div>
            
            <div class="info-row">Travel Date: ${formattedDate}</div>
            
            <div class="divider"></div>
            
            <div class="code">Code: ${formData.code}</div>
            <div class="amount">Paid: UGX ${formatAmount(formData.amountPaid)}</div>
            
            <div class="header-info">Visit link below to review Terms and Conditions</div>
            <div class="divider"></div>
            <div class="header-info">www.link.co.ug/terms-of-service.php</div>
            
            <div class="divider"></div>
            
            <div class="footer">Thank you for travelling with us</div>
            
            ${qrBase64 ? `
              <div class="qr-container">
                <img src="data:image/png;base64,${qrBase64}" class="qr-code" />
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Export PDF error:', error);
      Alert.alert('Error', 'Failed to export receipt to PDF');
    }
  };

  if (!formData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No form data available.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title} onPress={() => Linking.openURL('#')}>
           LINK BUS TICKET
          </Text>

          <View style={styles.section}>
            <Text style={styles.texthead}>+256 751206424 | +256 782099992</Text>
            <Text style={styles.texthead}>First Floor Solar House</Text>
            <Text style={styles.texthead}>Plot 63 Muuteesa I Road</Text>
            <View style={styles.numberPlate}>
               <Text style={styles.headingbig}>{formData.numberPlatePrefix.toUpperCase()}</Text>
               <Text style={styles.headingbig}>{formData.numberPlatePostfix.toUpperCase()}</Text>
            </View>
           
            <Text style={styles.divider}></Text>
          </View>
 
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>Client Name</Text>
              <Text style={styles.value}>:  {formData.clientName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ticket ID</Text>
              <Text style={styles.value}>:  {formData.ticketId}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone No.</Text>
              <Text style={styles.value}>:  {formData.phoneNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Temperature</Text>
              <Text style={styles.value}>:  {formData.temperature}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>From</Text>
              <Text style={styles.value}>:  {formData.from}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>To</Text>
              <Text style={styles.value}>:  {formData.to}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment</Text>
              <Text style={styles.value}>:  {formData.paymentStatus?.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Printed by</Text>
              <Text style={styles.value}>:  {formData.printedBy || staffName}</Text>
            </View>
            {/* <View style={styles.row}>
              <Text style={styles.label}>Printed on:</Text>
              <Text style={styles.value}>{formattedDate} at {formattedTime}</Text>
            </View> */}
            <View style={styles.row}>
              <Text style={styles.label}>Travel Date</Text>
              <Text style={styles.value}>:  {formattedDate}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.divider}></Text>
            <Text style={styles.heading2}>Code: {formData.code}</Text>
            <Text style={styles.heading2}>Paid: UGX {formatAmount(formData.amountPaid)}</Text>
            <Text style={styles.texthead}>Visit link below to review Terms and Conditions</Text>
            <Text style={styles.divider}></Text>
            <Text style={styles.texthead}>www.link.co.ug/terms-of-service.php</Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.texthead}>Thank you for travelling with us</Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={`TICKET:${formData.ticketId}`}
              size={128}
              getRef={(ref) => setQrRef(ref)}
            />
          </View> 
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
            <FontAwesome name="print" size={24} color="#fff" />
            <Text style={styles.printButtonText}>Print Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <FontAwesome name="file-pdf-o" size={24} color="#fff" />
            <Text style={styles.exportButtonText}>Export to PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <BluetoothDeviceSelector
        visible={showDeviceSelector}
        onClose={() => setShowDeviceSelector(false)}
        onSelectDevice={handleDeviceSelected}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 16,
  },
  headingbig: {
    fontSize: 29,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  numberPlate: {
   
    display:'flex',
    flexDirection:'row',
    
    justifyContent:'center',
    gap:15
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  heading2: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
  texthead: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 4,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 10,
    paddingBottom: 10,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    height: 2,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#888',
    marginVertical: 16,
    fontWeight:'bold',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  iconButton: {
    marginHorizontal: 10,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#4b5563',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#4b5563',
    flex: 1,
    textAlign: 'left',
    // marginLeft:4,
  },
});

export default ReceiptPreview;