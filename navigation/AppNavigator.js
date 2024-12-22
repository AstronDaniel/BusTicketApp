import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext } from "../contexts/AuthContext";

// Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ReceiptDetailsScreen from "../screens/ReceiptDetailsScreen";
import GenerateReceiptScreen from "../screens/GenerateReceiptScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // Authenticated Screens
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "Home" }}
            />
            <Stack.Screen
              name="GenerateReceipt"
              component={GenerateReceiptScreen}
              options={{ title: "Generate Receipt" }}
            />
            <Stack.Screen
              name="ReceiptDetails"
              component={ReceiptDetailsScreen}
              options={{ title: "Receipt Details" }}
            />
          </>
        ) : (
          // Unauthenticated Screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: "Login" }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: "Register" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
