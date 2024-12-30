import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ReportService from '../services/ReportService';

const AddReportScreen = ({ navigation }) => {
  const [reportData, setReportData] = useState({
    title: '',
    date: '',
    content: ''
  });

  const handleChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddReport = async () => {
    if (!reportData.title || !reportData.date || !reportData.content) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    try {
      await ReportService.addReport(reportData);
      Alert.alert('Success', 'Report added successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add report. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={reportData.title}
        onChangeText={(value) => handleChange('title', value)}
        placeholder="Enter report title"
      />
      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={reportData.date}
        onChangeText={(value) => handleChange('date', value)}
        placeholder="Enter report date"
      />
      <Text style={styles.label}>Content</Text>
      <TextInput
        style={styles.input}
        value={reportData.content}
        onChangeText={(value) => handleChange('content', value)}
        placeholder="Enter report content"
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleAddReport}>
        <Text style={styles.buttonText}>Add Report</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default AddReportScreen;
