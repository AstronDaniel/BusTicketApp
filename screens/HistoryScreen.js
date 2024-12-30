import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from "../contexts/AuthContext";
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const HistoryScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email !== 'astrondaniel6@gmail.com') {
      Alert.alert('Access Denied', 'You do not have permission to access this screen.');
      navigation.goBack();
      return;
    }

    const fetchHistory = async () => {
      try {
        const historyQuery = query(collection(db, 'tickets'));
        const historySnapshot = await getDocs(historyQuery);
        const historyData = await Promise.all(historySnapshot.docs.map(async (ticketDoc) => {
          const data = ticketDoc.data();
          const userDoc = await getDoc(doc(db, 'users', data.email));
          const userName = userDoc.exists() ? `${userDoc.data().firstName} ${userDoc.data().lastName}` : 'Unknown User';
          return {
            id: ticketDoc.id,
            ticketId: data.ticketId,
            clientName: data.clientName,
            from: data.from,
            to: data.to,
            date: data.date,
            printedBy: userName
          };
        }));
        setHistory(historyData);
      } catch (error) {
        console.error("Error fetching history:", error);
        Alert.alert('Error', 'Failed to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
     
    >
      <LinearGradient
        colors={['#2c3e50', '#3498db']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientCard}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketId}>#{item.ticketId}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        
        <Text style={styles.clientName}>{item.clientName}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>From:</Text>
            <Text style={styles.value}>{item.from}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>To:</Text>
            <Text style={styles.value}>{item.to}</Text>
          </View>
        </View>
        
        <Text style={styles.printedBy}>Printed by: {item.printedBy}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#1a1a1a', '#2c3e50']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2c3e50']}
      style={styles.container}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={['#2c3e50', '#3498db']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Ticket History</Text>
        </LinearGradient>
      </View>
      
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    marginBottom: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  ticketId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  detailsContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    color: '#89cff0',
    fontWeight: '500',
    width: '30%',
  },
  value: {
    fontSize: 15,
    color: '#ffffff',
    width: '70%',
  },
  dateText: {
    fontSize: 14,
    color: '#89cff0',
    fontStyle: 'italic',
  },
  printedBy: {
    fontSize: 14,
    color: '#89cff0',
    marginTop: 12,
    textAlign: 'right',
    fontStyle: 'italic',
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
});

export default HistoryScreen;