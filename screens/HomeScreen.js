import React, { useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Animated,
  Image,
  ScrollView
} from 'react-native';
import { AuthContext } from "../contexts/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const { logout, user } = useContext(AuthContext);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <MaterialIcons name="receipt-long" size={24} color="#4A90E2" />
        <Text style={styles.statNumber}>0</Text>
        <Text style={styles.statLabel}>Today's Tickets</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialIcons name="people" size={24} color="#4A90E2" />
        <Text style={styles.statNumber}>0</Text>
        <Text style={styles.statLabel}>Passengers</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.scrollView}>
      <LinearGradient
        colors={['#4A90E2', '#50E3C2']}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <Image
            source={require('../assets/bus-icon.jpg')} // Make sure to add this image
            style={styles.headerIcon}
          />
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Staff Member'}</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View 
        style={[
          styles.mainContent,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {renderQuickStats()}

        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => navigation.navigate("GenerateReceipt")}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.generateGradient}
          >
            <MaterialIcons name="receipt" size={24} color="#fff" />
            <Text style={styles.generateButtonText}>Generate Receipt</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome5 name="history" size={20} color="#4A90E2" />
            <Text style={styles.actionButtonText}>History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="analytics" size={20} color="#4A90E2" />
            <Text style={styles.actionButtonText}>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={logout}
          >
            <MaterialIcons name="logout" size={20} color="#FF4B4B" />
            <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerIcon: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  generateButton: {
    marginBottom: 25,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '31%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2D3436',
    marginTop: 5,
    textAlign: 'center',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  logoutText: {
    color: '#FF4B4B',
  },
});

export default HomeScreen;