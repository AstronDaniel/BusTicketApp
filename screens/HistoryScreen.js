import React, { useContext, useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, 
  ActivityIndicator, Modal, TextInput, Platform, ScrollView 
} from 'react-native';
import { AuthContext } from "../contexts/AuthContext";
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

const HistoryScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [summaryData, setSummaryData] = useState({
    totalTickets: 0,
    totalRevenue: 0,
    popularRoutes: [],
    busUtilization: {}
  });
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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
          
          // Format the date string to be consistent
          const [datePart, timePart] = data.date.split(' ');
          const [day, month, year] = datePart.split('-');
          data.date = `${day}-${month}-${year} ${timePart || ''}`;
          
          if (data.printedBy) {
            const userDocRef = doc(db, 'users', data.printedBy);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              data.printedByUserName = userSnap.data().displayName || data.printedBy;
              data.printedByEmail = userSnap.data().email || '';
            }
          }
          return {
            id: ticketDoc.id,
            ...data,
            amountPaid: parseFloat(data.amountPaid) || 0
          };
        }));
  
        // Get unique list of emails instead of printedBy names
        const users = [...new Set(historyData.map(ticket => ticket.email))].filter(Boolean);
        setUsersList(users);
        
        setHistory(historyData);
        const summary = calculateSummary(historyData);
        setSummaryData(summary);
      } catch (error) {
        console.error("Error:", error);
        Alert.alert('Error', 'Failed to load history.');
      } finally {
        setLoading(false);
      }
    };
  
  
  
    fetchHistory();
  }, [user, navigation]);

  const calculateSummary = (data) => {
    const totalTickets = data.length;
    // Fix NaN issue by ensuring amountPaid is properly parsed
    const totalRevenue = data.reduce((sum, ticket) => {
      const amount = parseFloat(ticket.amountPaid) || 0;
      return sum + amount;
    }, 0);
    
    return {
      totalTickets,
      totalRevenue,
      popularRoutes: calculatePopularRoutes(data),
      busUtilization: calculateBusUtilization(data)
    };
  };

  const calculatePopularRoutes = (data) => {
    const routes = {};
    data.forEach(ticket => {
      const route = `${ticket.from} → ${ticket.to}`;
      routes[route] = (routes[route] || 0) + 1;
    });
    return Object.entries(routes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const calculateBusUtilization = (data) => {
    const buses = {};
    data.forEach(ticket => {
      if (ticket.numberPlatePrefix) {
        buses[ticket.numberPlatePrefix] = (buses[ticket.numberPlatePrefix] || 0) + 1;
      }
    });
    return buses;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isThisWeek = (date) => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    return date >= weekStart && date <= weekEnd;
  };

  const generateCSV = (data) => {
    const headers = ['Ticket ID', 'Client Name', 'From', 'To', 'Date', 'Amount', 'Payment Status'];
    const rows = data.map(ticket => [
      ticket.ticketId,
      ticket.clientName,
      ticket.from,
      ticket.to,
      ticket.date,
      ticket.amountPaid,
      ticket.paymentStatus?.name || ''
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getFilteredHistory = () => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    
    return history.filter(ticket => {
      // Search matching
      const searchFields = [
        ticket.clientName?.toLowerCase() || '',
        ticket.ticketId?.toLowerCase() || '',
        ticket.from?.toLowerCase() || '',
        ticket.to?.toLowerCase() || '',
        ticket.email?.toLowerCase() || '',  // Changed from printedBy to email
        ticket.numberPlate?.toLowerCase() || ''
      ];
      
      const matchesSearch = !searchQuery || searchFields.some(field => 
        field.includes(lowerCaseQuery)
      );
  
      // User filtering - now using email instead of printedBy
      const matchesUser = !selectedUser || ticket.email === selectedUser;
      
      // Date filtering
      const ticketDate = new Date(ticket.date.split(' ')[0].split('-').reverse().join('-'));
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const matchesDateRange = ticketDate >= startOfDay && ticketDate <= endOfDay;
  
      return matchesSearch && matchesUser && matchesDateRange;
    }).sort((a, b) => {
      const dateA = new Date(a.date.split(' ')[0].split('-').reverse().join('-'));
      const dateB = new Date(b.date.split(' ')[0].split('-').reverse().join('-'));
      return dateB - dateA;
    });
  };
  const generatePDF = async (data) => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ticket History Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p>Total Tickets: ${summaryData.totalTickets}</p>
            <p>Total Revenue: UGX ${summaryData.totalRevenue.toLocaleString()}</p>
            ${selectedUser ? `<p>Staff Member: ${selectedUser}</p>` : ''}
          </div>

          <table>
            <tr>
              <th>Ticket ID</th>
              <th>Client Name</th>
              <th>Route</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Staff</th>
            </tr>
            ${data.map(ticket => `
              <tr>
                <td>${ticket.ticketId}</td>
                <td>${ticket.clientName}</td>
                <td>${ticket.from} → ${ticket.to}</td>
                <td>UGX ${ticket.amountPaid.toLocaleString()}</td>
                <td>${ticket.date}</td>
                <td>${ticket.printedBy}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

    try {
      const options = {
        html,
        fileName: 'TicketHistory',
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      return file.filePath;
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      const filtered = getFilteredHistory();
      const pdfPath = await generatePDF(filtered);
      
      await Share.open({
        url: `file://${pdfPath}`,
        type: 'application/pdf',
        title: 'Ticket History Report'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (dateType === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const showDateSelector = (type) => {
    setDateType(type);
    setTempDate(type === 'start' ? startDate : endDate);
    setShowDatePicker(true);
  };

  const renderSummarySection = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Tickets</Text>
          <Text style={styles.summaryValue}>{summaryData.totalTickets}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
          <Text style={styles.summaryValue}>UGX {summaryData.totalRevenue.toLocaleString()}</Text>
        </View>
      </View>
      
      <Text style={styles.summarySubtitle}>Popular Routes</Text>
      {summaryData.popularRoutes.map(([route, count]) => (
        <Text key={route} style={styles.routeText}>{route}: {count} tickets</Text>
      ))}
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => setSelectedTicket(item)}
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
        
        <Text style={styles.printedBy}>
          Printed by: {item.printedByUserName || item.printedBy}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTicketDetailModal = () => {
    if (!selectedTicket) return null;
    return (
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { width: '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ticket Details</Text>
            <TouchableOpacity onPress={() => setSelectedTicket(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.ticketDetailRow}>
              <Text style={styles.detailLabel}>Ticket ID:</Text>
              <Text style={styles.detailValue}>#{selectedTicket.ticketId}</Text>
            </View>

            <View style={styles.ticketDetailRow}>
              <Text style={styles.detailLabel}>Client Name:</Text>
              <Text style={styles.detailValue}>{selectedTicket.clientName}</Text>
            </View>

            <View style={styles.ticketDetailRow}>
              <Text style={styles.detailLabel}>From:</Text>
              <Text style={styles.detailValue}>{selectedTicket.from}</Text>
            </View>

            <View style={styles.ticketDetailRow}>
              <Text style={styles.detailLabel}>To:</Text>
              <Text style={styles.detailValue}>{selectedTicket.to}</Text>
            </View>

            <View style={styles.ticketDetailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{selectedTicket.date}</Text>
            </View>

            <View style={styles.ticketDetailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>
                UGX {Number(selectedTicket.amountPaid).toLocaleString()}
              </Text>
            </View>

            <View style={styles.ticketDetailRow}>
              <Text style={styles.detailLabel}>Payment Status:</Text>
              <Text style={styles.detailValue}>
                {selectedTicket.paymentStatus?.name || 'N/A'}
              </Text>
            </View>

            <View style={styles.ticketDetailRow}>
              <Text style={styles.detailLabel}>Bus Number:</Text>
              <Text style={styles.detailValue}>
                {selectedTicket.numberPlate || 'N/A'}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedTicket(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFilterResults = () => {
    const filtered = getFilteredHistory();
    console.log("Filtered Results:", filtered);
    return (
      <>
        <View style={styles.filterResultsHeader}>
          <Text style={styles.filterResultsText}>
            Found {filtered.length} tickets
          </Text>
        </View>
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No tickets found</Text>
            </View>
          )}
        />
      </>
    );
  };

  const renderFilterModal = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Filter Tickets</Text>
      
      <Text style={styles.filterLabel}>Date Range</Text>
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => showDateSelector('start')}
      >
        <Text style={styles.dateButtonText}>
          Start Date: {startDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
  
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => showDateSelector('end')}
      >
        <Text style={styles.dateButtonText}>
          End Date: {endDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
  
      <Text style={styles.filterLabel}>Filter by Email</Text>
      <ScrollView style={styles.usersList}>
        <TouchableOpacity
          style={[styles.userButton, !selectedUser && styles.userButtonActive]}
          onPress={() => setSelectedUser(null)}
        >
          <Text style={[styles.userButtonText, !selectedUser && styles.userButtonTextActive]}>
            All Emails
          </Text>
        </TouchableOpacity>
        {usersList.map(email => (
          <TouchableOpacity
            key={email}
            style={[styles.userButton, selectedUser === email && styles.userButtonActive]}
            onPress={() => setSelectedUser(email)}
          >
            <Text style={[styles.userButtonText, selectedUser === email && styles.userButtonTextActive]}>
              {email}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
  
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setFilterModalVisible(false)}
      >
        <Text style={styles.closeButtonText}>Apply Filters</Text>
      </TouchableOpacity>
    </View>
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
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="filter" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport}>
            <Ionicons name="download-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {renderSummarySection()}
      {renderFilterResults()}
      
      {/* Date Picker */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {renderFilterModal()}
        </View>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        visible={!!selectedTicket}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTicket(null)}
      >
        {renderTicketDetailModal()}
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    margin: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginRight: 10,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#89cff0',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summarySubtitle: {
    color: '#89cff0',
    fontSize: 16,
    marginVertical: 10,
  },
  routeText: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateButtonText: {
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ticketDetailRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    flex: 2,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterResultsHeader: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  filterResultsText: {
    color: '#fff',
    fontSize: 14,
    fontStyle: 'italic',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    color: '#fff',
    fontSize: 16,
    fontStyle: 'italic',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
    marginBottom: 10,
  },
  usersList: {
    maxHeight: 200,
  },
  userButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userButtonActive: {
    backgroundColor: '#007AFF',
  },
  userButtonText: {
    fontSize: 14,
    color: '#333',
  },
  userButtonTextActive: {
    color: '#fff',
  }
});

export default HistoryScreen;