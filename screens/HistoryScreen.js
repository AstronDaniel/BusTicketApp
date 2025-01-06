import React, { useContext, useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, 
  ActivityIndicator, Modal, TextInput, Platform, ScrollView, RefreshControl,Dimensions
} from 'react-native';
import { AuthContext } from "../contexts/AuthContext";
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
// new imports
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInUp } from 'react-native-reanimated';
 
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
// new variables
// Add these new state variables right after your existing useState declarations
const [activeFilter, setActiveFilter] = useState('all');
const [viewMode, setViewMode] = useState('list');
const [refreshing, setRefreshing] = useState(false);
const [todayStats, setTodayStats] = useState({
  ticketsSold: 0,
  revenue: 0,
  percentageChange: 0
});
const [revenueData, setRevenueData] = useState({
  labels: [],
  datasets: [{
    data: []
  }]
});


    // new functions for stats and revenue
    // Add this function after your existing useEffect
    const calculateTodayStats = (data) => {
      const today = new Date();
      const todayString = today.toLocaleDateString();
      
      const todayTickets = data.filter(ticket => {
        const ticketDate = new Date(ticket.date.split(' ')[0].split('-').reverse().join('-'));
        return ticketDate.toLocaleDateString() === todayString;
      });
    
      const todayRevenue = todayTickets.reduce((sum, ticket) => sum + parseFloat(ticket.amountPaid), 0);
      
      return {
        ticketsSold: todayTickets.length,
        revenue: todayRevenue,
        percentageChange: 0 // You can calculate this by comparing with yesterday's data
      };
    };
    
    // Add this function to calculate revenue data for the chart
    const calculateRevenueData = (data) => {
      const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      }).reverse();
    
      const labels = last7Days.map(date => date.toLocaleDateString('en-US', { weekday: 'short' }));
      const revenues = last7Days.map(date => {
        const dayTickets = data.filter(ticket => {
          const ticketDate = new Date(ticket.date.split(' ')[0].split('-').reverse().join('-'));
          return ticketDate.toLocaleDateString() === date.toLocaleDateString();
        });
        return dayTickets.reduce((sum, ticket) => sum + parseFloat(ticket.amountPaid), 0);
      });
    
      return {
        labels,
        datasets: [{
          data: revenues
        }]
      };
    };
    // fetch history data
    const fetchHistory = async () => {
      try {
        setLoading(true);
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

        // Calculate new statistics
      setTodayStats(calculateTodayStats(historyData));
      setRevenueData(calculateRevenueData(historyData));

        const summary = calculateSummary(historyData);
        setSummaryData(summary);
      } catch (error) {
        console.error("Error:", error);
        Alert.alert('Error', 'Failed to load history.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
  
    // Add these components right after your existing components
    const StatisticsCard = () => (
      <Animated.View 
        entering={FadeInUp.delay(200)}
        style={styles.statsCard}
      >
        <View style={styles.statsHeader}>
          <View>
            <Text style={styles.statsTitle}>Today's Stats</Text>
            <Text style={styles.statsSubtitle}>Quick overview of today's activity</Text>
          </View>
          <View style={styles.statsIcon}>
            <MaterialIcons name="bar-chart" color="#fff" size={24} />
          </View>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>Tickets Sold</Text>
            <Text style={styles.statsValue}>{todayStats.ticketsSold}</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsLabel}>Revenue</Text>
            <Text style={styles.statsValue}>
              UGX {todayStats.revenue.toLocaleString()}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
    
    const RevenueChart = () => (
      <Animated.View 
        entering={FadeInUp.delay(400)}
        style={styles.chartCard}
      >
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Revenue Trends</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => fetchHistory()}
          >
            <Ionicons name="refresh" color="#3b82f6" size={20} />
          </TouchableOpacity>
        </View>
        
        <LineChart
          data={revenueData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </Animated.View>
    );
    
    const FilterChips = () => (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterChips}
      >
        {['all', 'today', 'week', 'month'].map((filter) => (
          <TouchableOpacity 
            key={filter}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.filterChipActive
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[
              styles.filterChipText,
              activeFilter === filter && styles.filterChipTextActive
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
    
    

  useEffect(() => {
    if (user?.email !== 'astrondaniel6@gmail.com') {
      Alert.alert('Access Denied', 'You do not have permission to access this screen.');
      navigation.goBack();
      return;
    }


  
  
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
    // First apply the active filter
    const ticketDate = new Date(ticket.date.split(' ')[0].split('-').reverse().join('-'));
    const matchesActiveFilter = () => {
      switch(activeFilter) {
        case 'today':
          return isToday(ticketDate);
        case 'week':
          return isThisWeek(ticketDate);
        case 'month':
          return ticketDate.getMonth() === new Date().getMonth() &&
                 ticketDate.getFullYear() === new Date().getFullYear();
        case 'all':
        default:
          return true;
      }
    };

    // Existing search and filter logic
    const searchFields = [
      ticket.clientName?.toLowerCase() || '',
      ticket.ticketId?.toLowerCase() || '',
      ticket.from?.toLowerCase() || '',
      ticket.to?.toLowerCase() || '',
      ticket.email?.toLowerCase() || '',
      ticket.numberPlate?.toLowerCase() || ''
    ];
    const matchesSearch = !searchQuery || searchFields.some(field => 
      field.includes(lowerCaseQuery)
    );
    const matchesUser = !selectedUser || ticket.email === selectedUser;
    const matchesDateRange = ticketDate >= startDate && ticketDate <= endDate;

    return matchesSearch && matchesUser && matchesDateRange && matchesActiveFilter();
  }).sort((a, b) => {
    const dateA = new Date(a.date.split(' ')[0].split('-').reverse().join('-'));
    const dateB = new Date(b.date.split(' ')[0].split('-').reverse().join('-'));
    return dateB - dateA;
  });
};

const generatePDF = async () => {
  const filteredData = getFilteredHistory();
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
          ${filteredData.map(ticket => `
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
    const pdfPath = await generatePDF();
    
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
    style={[styles.itemContainer, viewMode === 'grid' && styles.gridItemContainer]}
    onPress={() => setSelectedTicket(item)}
  >
    <LinearGradient
      colors={['#6a11cb', '#2575fc']} // Updated gradient colors
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

const renderHeader = () => (
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
      <TouchableOpacity 
        style={styles.viewModeButton}
        onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
      >
        <Ionicons name={viewMode === 'list' ? 'grid' : 'list'} size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  </View>
);

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
      {viewMode === 'list' ? (
        <FlatList
          key="list" // Add key to force re-render
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
      ) : (
        <FlatList
          key="grid" // Add key to force re-render
          data={filtered}
          renderItem={renderItem} // You can create a separate renderGridItem if needed
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          ListEmptyComponent={() => (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No tickets found</Text>
            </View>
          )}
        />
      )}
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
      {renderHeader()}
      <ScrollView 
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchHistory();
          }}
        />
      }
    >
      <StatisticsCard />
      <RevenueChart />
      <FilterChips />
      {renderSummarySection()}
      {renderFilterResults()}
    </ScrollView>
      
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
  viewModeButton: {
    marginLeft: 10,
    padding: 5,
    backgroundColor: '#3498db',
    borderRadius: 8,
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
    backgroundColor: '#2c3e50', // Add background color for better visibility
  },
  gridItemContainer: {
    width: (Dimensions.get('window').width / 2) - 24, // Adjust width for grid items
    marginHorizontal: 8,
  },
  gradientCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  },
  // new styles
  statsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#93c5fd',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  chartCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  filterChips: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    color: '#4b5563',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
});

export default HistoryScreen;