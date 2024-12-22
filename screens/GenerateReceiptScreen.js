import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";

const GenerateReceiptScreen = ({ navigation }) => {
  const [clientName, setClientName] = useState("");
  const [ticketID, setTicketID] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentType, setPaymentType] = useState("");

  const handleGenerate = () => {
    if (!clientName || !ticketID || !phoneNumber || !amountPaid || !paymentType) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    const receiptDetails = {
      clientName,
      ticketID,
      phoneNumber,
      amountPaid,
      paymentType,
    };

    navigation.navigate("ReceiptDetails", { receiptDetails });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Receipt</Text>

      <TextInput
        style={styles.input}
        placeholder="Client Name"
        value={clientName}
        onChangeText={setClientName}
      />

      <TextInput
        style={styles.input}
        placeholder="Ticket ID"
        value={ticketID}
        onChangeText={setTicketID}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="numeric"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

      <TextInput
        style={styles.input}
        placeholder="Amount Paid"
        keyboardType="numeric"
        value={amountPaid}
        onChangeText={setAmountPaid}
      />

      <TextInput
        style={styles.input}
        placeholder="Payment Type (e.g., Cash, Card)"
        value={paymentType}
        onChangeText={setPaymentType}
      />

      <Button title="Generate Receipt" onPress={handleGenerate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2196F3",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});

export default GenerateReceiptScreen;
