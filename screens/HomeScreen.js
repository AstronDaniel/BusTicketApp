import React, { useContext } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { AuthContext } from "../contexts/AuthContext";

const HomeScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to the Bus Ticket App!</Text>
      <Button
        title="Generate Receipt"
        onPress={() => navigation.navigate("GenerateReceipt")}
      />
      <View style={styles.spacer} />
      <Button
        title="Logout"
        color="red"
        onPress={() => {
          logout();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 30,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  spacer: {
    height: 20,
  },
});

export default HomeScreen;
