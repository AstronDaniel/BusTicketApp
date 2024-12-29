import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  PermissionsAndroid,
  Platform
} from 'react-native';
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';

const PRINTER_KEYWORDS = ['printer', 'pos', 'thermal', 'receipt', 'escpos'];

const isPrinterDevice = (deviceName = '') => {
  const name = deviceName?.toLowerCase() || '';
  return PRINTER_KEYWORDS.some(keyword => name.includes(keyword));
};

const requestBluetoothPermissions = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    // First check if permissions are already granted
    const fineLocation = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    const coarseLocation = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
    );

    if (fineLocation && coarseLocation) {
      console.log('Permissions already granted');
      return true;
    }

    const permissions = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ];

    // Only add these permissions for Android 12+ (API level 31+)
    if (Platform.Version >= 31) {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
    }

    const results = await PermissionsAndroid.requestMultiple(permissions);
    
    console.log('Permission results:', results);
    return Object.values(results).every(result => result === 'granted');
  } catch (err) {
    console.warn('Error requesting Bluetooth permissions:', err);
    return false;
  }
};

const parsePairedDevices = (pairedStr) => {
  try {
    // If pairedStr is falsy, return empty array
    if (!pairedStr) return [];

    // If it's already an array of objects, return it
    if (Array.isArray(pairedStr) && typeof pairedStr[0] === 'object') {
      return pairedStr;
    }

    // If it's a string, try to parse it
    const parsed = typeof pairedStr === 'string' ? JSON.parse(pairedStr) : pairedStr;
    
    if (Array.isArray(parsed)) {
      return parsed.map(device => {
        if (typeof device === 'string') {
          try {
            return JSON.parse(device);
          } catch (e) {
            console.warn('Failed to parse device string:', device);
            return null;
          }
        }
        return device;
      }).filter(Boolean);
    }

    return [];
  } catch (e) {
    console.warn('Error parsing paired devices:', e);
    return [];
  }
};

const BluetoothDeviceSelector = ({ visible, onClose, onSelectDevice }) => {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [showOnlyPrinters, setShowOnlyPrinters] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  const checkPermissions = async () => {
    try {
      const granted = await requestBluetoothPermissions();
      console.log('Permissions check result:', granted);
      setHasPermissions(granted);
      return granted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermissions(false);
      return false;
    }
  };

  const scanDevices = async () => {
    try {
      if (!hasPermissions) {
        const granted = await checkPermissions();
        if (!granted) {
          setError('Bluetooth permissions not granted');
          return;
        }
      }

      setScanning(true);
      setError('');
      
      // Enable Bluetooth and get paired devices
      let pairedStr;
      try {
        pairedStr = await BluetoothManager.enableBluetooth();
        console.log('Paired devices string:', pairedStr);
      } catch (btError) {
        console.error('Error enabling Bluetooth:', btError);
        throw new Error('Failed to enable Bluetooth');
      }
      
      // Parse paired devices
      const pairedDevices = parsePairedDevices(pairedStr)
        .map(device => ({
          name: device.name || 'Unknown Device',
          address: device.address,
          paired: true,
          isPrinter: isPrinterDevice(device.name)
        }));
      
      console.log('Parsed paired devices:', pairedDevices);
      setDevices(pairedDevices);
      
      // Scan for new devices
      try {
        const scanResult = await BluetoothManager.scanDevices();
        console.log('Scan result:', scanResult);
        
        let scannedDevices = [];
        if (scanResult && typeof scanResult === 'object') {
          const { found = [], paired = [] } = scanResult;
          scannedDevices = [...found, ...paired]
            .filter(device => device && device.address)
            .map(device => ({
              name: device.name || 'Unknown Device',
              address: device.address,
              paired: paired.some(p => p.address === device.address),
              isPrinter: isPrinterDevice(device.name)
            }));
        }

        const allDevices = [...pairedDevices, ...scannedDevices];
        const uniqueDevices = allDevices.reduce((acc, current) => {
          if (!current?.address) return acc;
          const exists = acc.find(device => device.address === current.address);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);

        console.log('Final device list:', uniqueDevices);
        setDevices(uniqueDevices);

        if (uniqueDevices.length === 0) {
          setError('No Bluetooth devices found');
        }
      } catch (scanError) {
        console.error('Error scanning for devices:', scanError);
        throw new Error('Failed to scan for devices');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setError(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (visible) {
        const granted = await checkPermissions();
        if (mounted && granted) {
          scanDevices();
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [visible]);

  const filteredDevices = useMemo(() => {
    return showOnlyPrinters 
      ? devices.filter(device => isPrinterDevice(device.name))
      : devices;
  }, [devices, showOnlyPrinters]);

  const renderDevice = ({ item }) => {
    const isPrinter = isPrinterDevice(item.name);
    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          isPrinter && styles.printerDevice,
          item.paired && styles.pairedDevice
        ]}
        onPress={() => onSelectDevice(item)}
      >
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
        <View style={styles.deviceLabels}>
          {isPrinter && <Text style={styles.printerLabel}>Printer</Text>}
          {item.paired && <Text style={styles.pairedLabel}>Paired</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (!hasPermissions) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Bluetooth permissions required</Text>
          <TouchableOpacity style={styles.button} onPress={checkPermissions}>
            <Text style={styles.buttonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (scanning) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.scanningText}>Scanning for devices...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredDevices}
        renderItem={renderDevice}
        keyExtractor={item => item.address}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {showOnlyPrinters ? 'No printer devices found' : 'No devices found'}
          </Text>
        }
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Device</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, showOnlyPrinters && styles.filterButtonActive]}
              onPress={() => setShowOnlyPrinters(!showOnlyPrinters)}
            >
              <Text style={[styles.filterButtonText, showOnlyPrinters && styles.filterButtonTextActive]}>
                {showOnlyPrinters ? 'Showing Printers Only' : 'Show All Devices'}
              </Text>
            </TouchableOpacity>
          </View>

          {renderContent()}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, scanning && styles.buttonDisabled]} 
              onPress={scanDevices}
              disabled={scanning}
            >
              <Text style={styles.buttonText}>
                {scanning ? 'Scanning...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  listContent: {
    padding: 10,
  },
  deviceItem: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  printerDevice: {
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9',
  },
  pairedDevice: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#666',
  },
  deviceLabels: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  printerLabel: {
    backgroundColor: '#2196F3',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    marginRight: 5,
  },
  pairedLabel: {
    backgroundColor: '#4CAF50',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  centerContent: {
    padding: 20,
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  buttonContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#007AFF',
  },
  filterButtonTextActive: {
    color: 'white',
  }
});

export default BluetoothDeviceSelector;