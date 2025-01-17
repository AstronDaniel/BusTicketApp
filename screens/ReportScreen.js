import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from "../contexts/AuthContext";
import { db } from '../config/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const ReportScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    if (user?.email !== 'astrondaniel6@gmail.com') {
      console.log('Access Denied', 'You do not have permission to access this screen.');
      navigation.goBack();
      return;
    }

    const fetchReports = async () => {
      try {
        const reportsQuery = query(collection(db, 'tickets'));
        const reportsSnapshot = await getDocs(reportsQuery);
        if (reportsSnapshot.empty) {
          Alert.alert('No Reports', 'No reports available.');
          setReports([]);
        } else {
          const reportsData = reportsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReports(reportsData);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        Alert.alert('Error', 'Failed to load reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, navigation]);

  const calculateAnalytics = (reports) => {
    const totalReports = reports.length;
    const totalAmount = reports.reduce((sum, report) => sum + parseFloat(report.amountPaid), 0);
    const averageAmount = (totalAmount / totalReports).toFixed(2);
    const locations = reports.reduce((acc, report) => {
      acc[report.from] = (acc[report.from] || 0) + 1;
      acc[report.to] = (acc[report.to] || 0) + 1;
      return acc;
    }, {});
    const paymentMethods = reports.reduce((acc, report) => {
      acc[report.paymentStatus.name] = (acc[report.paymentStatus.name] || 0) + 1;
      return acc;
    }, {});
    const temperatureReadings = reports.map(report => parseFloat(report.temperature));
    const averageTemperature = (temperatureReadings.reduce((sum, temp) => sum + temp, 0) / temperatureReadings.length).toFixed(2);

    return {
      totalReports,
      totalAmount,
      averageAmount,
      locations,
      paymentMethods,
      averageTemperature
    };
  };

  const analytics = calculateAnalytics(reports);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.reportTitle}>{item.title}</Text>
      <Text style={styles.reportDate}>{item.date}</Text>
      <Text style={styles.reportContent}>{item.content}</Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#1a1a1a', '#2c2c2c']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2c2c2c']}
      style={styles.container}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={['#2c3e50', '#3498db']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Reports</Text>
        </LinearGradient>
      </View>
      
      <View style={styles.analyticsContainer}>
        <Text style={styles.analyticsText}>Total Reports: {analytics.totalReports}</Text>
        <Text style={styles.analyticsText}>Total Amount: ${analytics.totalAmount}</Text>
        <Text style={styles.analyticsText}>Average Amount: ${analytics.averageAmount}</Text>
        <Text style={styles.analyticsText}>Average Temperature: {analytics.averageTemperature}°C</Text>
        <Text style={styles.analyticsText}>Locations:</Text>
        {Object.entries(analytics.locations).map(([location, count]) => (
          <Text key={location} style={styles.analyticsText}>{location}: {count}</Text>
        ))}
        <Text style={styles.analyticsText}>Payment Methods:</Text>
        {Object.entries(analytics.paymentMethods).map(([method, count]) => (
          <Text key={method} style={styles.analyticsText}>{method}: {count}</Text>
        ))}
      </View>

      {/* {reports.length === 0 ? (
        <View style={styles.noReportsContainer}>
          <Text style={styles.noReportsText}>No reports available.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )} */}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    elevation: 4,
  },
  headerGradient: {
    padding: 16,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a73e8',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 12,
  },
  reportContent: {
    fontSize: 16,
    color: '#202124',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  noReportsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noReportsText: {
    fontSize: 18,
    color: '#ffffff',
  },
  analyticsContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  analyticsText: {
    fontSize: 16,
    color: '#202124',
    marginBottom: 8,
  },
});

export default ReportScreen;
