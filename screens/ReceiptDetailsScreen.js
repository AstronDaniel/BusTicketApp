import React from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";

const ReceiptDetailsScreen = ({ route, navigation }) => {
  const { receiptDetails } = route.params;

  const handlePrintReceipt = () => {
    // Simulated printing process
    Alert.alert("Printing", "The receipt is being printed...");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receipt Preview</Text>

      <View style={styles.receiptContainer}>
        <Text style={styles.receiptText}>
          <Text style={styles.label}>Client Name:</Text> {receiptDetails.clientName}
        </Text>
        <Text style={styles.receiptText}>
          <Text style={styles.label}>Ticket ID:</Text> {receiptDetails.ticketID}
        </Text>
        <Text style={styles.receiptText}>
          <Text style={styles.label}>Phone Number:</Text> {receiptDetails.phoneNumber}
        </Text>
        <Text style={styles.receiptText}>
          <Text style={styles.label}>Amount Paid:</Text> UGX {receiptDetails.amountPaid}
        </Text>
        <Text style={styles.receiptText}>
          <Text style={styles.label}>Payment Type:</Text> {receiptDetails.paymentType}
        </Text>
      </View>

      <View style={styles.buttons}>
        <Button
          title="Print Receipt"
          onPress={handlePrintReceipt}
          color="#4CAF50"
        />
        <View style={styles.spacer} />
        <Button
          title="Back to Home"
          onPress={() => navigation.navigate("Home")}
          color="#2196F3"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff", // added
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  receiptContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10, // added
    marginBottom: 20,
    elevation: 3,
  },
  receiptText: {
    fontSize: 16,
    marginVertical: 5,
  },
  label: {
    fontWeight: "bold",
  },
  buttons: {
    marginTop: 20,
  },
  spacer: {
    height: 10,
  },
});

export default ReceiptDetailsScreen;
