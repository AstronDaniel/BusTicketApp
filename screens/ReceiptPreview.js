import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AuthContext } from "../contexts/AuthContext";
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import PrintService from '../services/PrintService';
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const generateTicketId = () => {
  return 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const ReceiptPreview = ({ route }) => {
  const { formData } = route.params || {};
  const { user } = useContext(AuthContext);
  const [staffName, setStaffName] = useState('Staff Member');
  const ticketId = generateTicketId();
  const randomCode = generateRandomCode();
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
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
      const permissions = Platform.select({
        android: [
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ]
      });

      const results = await Promise.all(
        permissions.map(async (permission) => {
          const result = await check(permission);
          
          if (result === RESULTS.DENIED) {
            return await request(permission);
          }
          
          return result;
        })
      );

      // Check if all permissions are granted
      const allGranted = results.every(
        result => result === RESULTS.GRANTED
      );

      console.log('Permission results:', results);
      return allGranted;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const handlePrint = async () => {
    try {
      console.log('Starting print process...');
      
      // Check permissions first
      const hasPermissions = await requestPermissions();
      console.log('Permissions granted:', hasPermissions);
      
      if (!hasPermissions) {
        Alert.alert(
          'Permission Denied', 
          'Bluetooth and location permissions are required to print receipts'
        );
        return;
      }

      // Check if Bluetooth is enabled
      const isEnabled = await BluetoothManager.isBluetoothEnabled();
      console.log('Bluetooth enabled:', isEnabled);
      
      if (!isEnabled) {
        Alert.alert('Bluetooth Required', 'Please enable Bluetooth to print receipts');
        return;
      }

      // Connect to printer
      console.log('Connecting to printer...');
      const printer = await PrintService.connectPrinter();
      console.log('Printer connected:', printer);

      // Prepare receipt data
      const receiptData = {
        ...formData,
        ticketId,
        date: `${formattedDate} ${formattedTime}`
      };
      
      // Print receipt
      console.log('Printing receipt...');
      await PrintService.printReceipt(receiptData);
      Alert.alert('Success', 'Receipt printed successfully!');
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', error.message);
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
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title} onPress={() => Linking.openURL('#')}>
        RUKUNDO EGUMEHO TRANSPORTERS
        </Text>

        <View style={styles.section}>
          <Text style={styles.texthead}>+256 762076555 | +256 772169814</Text>
          <Text style={styles.texthead}>Kagafi Taxi Park</Text>
          <Text style={styles.texthead}>Plot 63 Kagadi</Text>
          <Text style={styles.headingbig}>{formData.from?.name}</Text>
          <Text style={styles.divider}></Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>Client Name: {formData.clientName}</Text>
          <Text style={styles.text}>Ticket ID: {ticketId}</Text>
          <Text style={styles.text}>Phone No.: {formData.phoneNumber}</Text>
          <Text style={styles.text}>From: {formData.from?.name}</Text>
          <Text style={styles.text}>To: {formData.to?.name}</Text>
          <Text style={styles.text}>Status: {formData.paymentStatus?.name}</Text>
          <Text style={styles.text}>Printed by: {staffName}</Text>
          <Text style={styles.text}>Printed on: {formattedDate} at {formattedTime}</Text>
          <Text style={styles.text}>Travel Date: {formattedDate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.divider}></Text>
          <Text style={styles.heading2}>Code: {randomCode}</Text>
          <Text style={styles.heading2}>Paid: UGX {formData.amountPaid}</Text>
          <Text style={styles.texthead}>Visit link below to review Terms and Conditions</Text>
          <Text style={styles.divider}></Text>
          <Text style={styles.texthead}>www.link.co.ug/terms-of-service.php</Text>
        </View>

        <View style={styles.divider} />
        <Text style={styles.texthead}>Thank you for travelling with us</Text>

        <View style={styles.qrContainer}>
          <QRCode value={`TICKET:${ticketId}`} size={128} />
        </View>
      </View>
      <TouchableOpacity style={styles.submitButton} onPress={handlePrint}>
        <Text style={styles.submitButtonText}>Print Receipt</Text>
      </TouchableOpacity>
    </ScrollView>
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
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
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
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
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
});

export default ReceiptPreview;