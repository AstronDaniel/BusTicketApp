import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AuthContext } from "../contexts/AuthContext";

const GenerateReceiptScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  // console.log("user:",user.email)
  const [formData, setFormData] = useState({
    clientName: '',
    phoneNumber: '',
    amountPaid: '',
    from: '',
    to: '',
    paymentStatus: null,
    temperature: '',
    printedBy: '', // Added field
    numberPlate: '', // Added field
    numberPlatePrefix: '', // Added field
    numberPlatePostfix: '', // Added field
  });

  
 

  const handleLocationSelect = (type) => {
    navigation.navigate('LocationSelection', {
      type,
      locations: getLocations(type),
      onSelect: (location) => {
        setFormData(prev => ({
          ...prev,
          [type]: location
        }));
      }
    });
  };

  const handlePaymentStatusSelect = () => {
    navigation.navigate('PaymentStatus', {
      locations: [
        { id: "cash", name: "Cash" },
        { id: "mobile", name: "Mobile Money" },
        { id: "Atm", name: "Atm" },
        { id: "Pending", name: "Pending" },
      ],
      onSelect: (status) => {
        setFormData(prev => ({
          ...prev,
          paymentStatus: status
        }));
      }
    });
  };
  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  const randomCode = generateRandomCode();

 

  const handlePreview = async () => {
    if (validateForm()) {
      const numberPlatePrefix = formData.numberPlate.substring(0, 3);
      const numberPlatePostfix = formData.numberPlate.substring(3, 10);
      
      const generateTicketId = () => {
        return `${numberPlatePrefix.toUpperCase()}` + Math.random().toString(36).substring(2, 8).toUpperCase();
      };
       const randomTicketId = generateTicketId();
      const ticketId = generateTicketId();
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
      const formattedTime = `${currentDate.getHours()}:${currentDate.getMinutes()}`;
     
      const updatedFormData = {
        ...formData,
        printedBy: formData.printedBy || user.email || 'Default Staff Member', // Default value if empty
        userId: user.uid, // Include userId
        email: user.email, // Include email
        ticketId,
        date: `${formattedDate} ${formattedTime}`,
        code:`${randomCode}`,
        ticketId:`${randomTicketId}`,
        numberPlatePrefix, // Added field
        numberPlatePostfix, // Added field
      };

      try {
        // Save to Firestore
        await addDoc(collection(db, 'tickets'), updatedFormData);
        navigation.navigate('ReceiptPreview', { formData: updatedFormData });
        console.log("data saved :", { formData: updatedFormData });
      } catch (error) {
        Alert.alert('Error', 'Failed to save receipt data.');
        console.error('Error saving receipt data:', error);
      }
    }
  };

  const validateForm = () => {
    const { clientName, phoneNumber, amountPaid, from, to, paymentStatus, temperature } = formData;
    if (!clientName || !phoneNumber || !amountPaid || !from || !to || !paymentStatus || !temperature) {
      Alert.alert('Error', 'All fields are required.');
      return false;
    }
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return false;
    }
    return true;
  };

  const getLocations = (type) => {
    if (type === 'from') {
      return [
        { id: 'Kampala', name: 'Kampala' },
        { id: 'Ishaka', name: 'Ishaka' },
        { id: 'Mbarara', name: 'Mbarara' },
        { id: 'Kasese', name: 'Kasese' },
        { id: 'Bushenyi', name: 'Bushenyi' },
        { id: 'Kabale', name: 'Kabale' },
        { id: 'Kisolo', name: 'Kisolo' },
      ];
    } else if (type === 'to') {
      return [
        { id: 'Kampala', name: 'Kampala' },
        { id: 'Ishaka', name: 'Ishaka' },
        { id: 'Mbarara', name: 'Mbarara' },
        { id: 'Kasese', name: 'Kasese' },
        { id: 'Bushenyi', name: 'Bushenyi' },
        { id: 'Kabale', name: 'Kabale' },
        { id: 'Kisolo', name: 'Kisolo' },
        
      ];
    }
    return [];
  };

  const formFields = [
    {
      key: 'header',
      content: (
        <Animatable.View animation="fadeIn" style={styles.headerContainer}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Generate Receipt</Text>
        </Animatable.View>
      )
    },
    {
      key: 'clientName',
      content: (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Client Name</Text>
          <TextInput
            style={styles.input}
            value={formData.clientName}
            onChangeText={value => setFormData(prev => ({ ...prev, clientName: value }))}
            placeholder="Enter client name"
          />
        </View>
      )
    },
    {
      key: 'phoneNumber',
      content: (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={value => setFormData(prev => ({ ...prev, phoneNumber: value }))}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
          />
        </View>
      )
    },
    {
      key: 'locations',
      content: (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>From</Text>
          <TextInput
            style={styles.input}
            value={formData.from}
            onChangeText={value => setFormData(prev => ({ ...prev, from: value }))}
            placeholder="Enter departure location"
          />
          <Text style={styles.label}>To</Text>
          <TextInput
            style={styles.input}
            value={formData.to}
            onChangeText={value => setFormData(prev => ({ ...prev, to: value }))}
            placeholder="Enter destination location"
          />
        </View>
      )
    },
    {
      key: 'amount',
      content: (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount Paid</Text>
          <TextInput
            style={styles.input}
            value={formData.amountPaid}
            onChangeText={value => setFormData(prev => ({ ...prev, amountPaid: value }))}
            keyboardType="numeric"
            placeholder="Enter amount"
          />
        </View>
      )
    },
    {
      key: 'paymentStatus',
      content: (
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.selectionButton}
            onPress={handlePaymentStatusSelect}
          >
            <Text style={styles.label}>Payment Status</Text>
            <Text style={styles.selectionText}>
              {formData.paymentStatus?.name || 'Select status'}
            </Text>
          </TouchableOpacity>
        </View>
      )
    },
    {
      key: 'temperature',
      content: (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Temperature</Text>
          <TextInput
            style={styles.input}
            value={formData.temperature}
            onChangeText={value => setFormData(prev => ({ ...prev, temperature: value }))}
            keyboardType="numeric"
            placeholder="Enter temperature"
            textContentType="none"
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={Keyboard.dismiss}
            editable
            selectTextOnFocus
          />
        </View>
      )
    },
    {
      key: 'printedBy', // Added field
      content: (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Printed By</Text>
          <TextInput
            style={styles.input}
            value={formData.printedBy}
            onChangeText={value => setFormData(prev => ({ ...prev, printedBy: value }))}
            placeholder="Enter staff member name"
          />
        </View>
      )
    },
    {
      key: 'numberPlate', // Added field
      content: (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bus Number Plate</Text>
          <TextInput
            style={styles.input}
            value={formData.numberPlate}
            onChangeText={value => setFormData(prev => ({ ...prev, numberPlate: value }))}
            placeholder="Enter bus number plate"
          />
        </View>
      )
    },
    {
      key: 'submit',
      content: (
        <TouchableOpacity style={styles.submitButton} onPress={handlePreview}>
          <Text style={styles.submitButtonText}>Preview Receipt</Text>
        </TouchableOpacity>
      )
    }
  ];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {formFields.map(field => (
            <View key={field.key}>
              {field.content}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  headerContainer: {
    alignItems: 'center',
    padding: 20
  },
  logo: {
    width: 80,
    height: 80
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10
  },
  inputContainer: {
    padding: 15
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  selectionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  selectionText: {
    fontSize: 16,
    color: '#666'
  },
  submitButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  locationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  locationText: {
    fontSize: 16
  }
});

export default GenerateReceiptScreen;