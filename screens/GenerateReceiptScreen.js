import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, FlatList } from 'react-native';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';

const GenerateReceiptScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    phoneNumber: '',
    amountPaid: '',
    from: null,
    to: null,
    paymentStatus: null
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

  const handlePreview = () => {
    if (validateForm()) {
      navigation.navigate('ReceiptPreview', { formData });
    }
  };

  const validateForm = () => {
    const { clientName, phoneNumber, amountPaid, from, to, paymentStatus } = formData;
    if (!clientName || !phoneNumber || !amountPaid || !from || !to || !paymentStatus) {
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
          <TouchableOpacity 
            style={styles.selectionButton}
            onPress={() => handleLocationSelect('from')}
          >
            <Text style={styles.label}>From</Text>
            <Text style={styles.selectionText}>
              {formData.from?.name || 'Select location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.selectionButton}
            onPress={() => handleLocationSelect('to')}
          >
            <Text style={styles.label}>To</Text>
            <Text style={styles.selectionText}>
              {formData.to?.name || 'Select location'}
            </Text>
          </TouchableOpacity>
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
      key: 'submit',
      content: (
        <TouchableOpacity style={styles.submitButton} onPress={handlePreview}>
          <Text style={styles.submitButtonText}>Preview Receipt</Text>
        </TouchableOpacity>
      )
    }
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={formFields}
        renderItem={({ item }) => item.content}
        keyExtractor={item => item.key}
        showsVerticalScrollIndicator={false}
      />
    </View>
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