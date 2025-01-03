import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext } from "../contexts/AuthContext";

// Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";

import ReceiptPreview from "../screens/ReceiptPreview";
import GenerateReceiptScreen from "../screens/GenerateReceiptScreen";
import LocationSelectionScreen from "../screens/LocationSelectionScreen"; // Ensure this import is correct
import HistoryScreen from "../screens/HistoryScreen";
import ReportScreen from "../screens/ReportScreen";
const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {user ? (
          // Authenticated Screens
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "Home" }}
            />
            <Stack.Screen
            name="History" component={HistoryScreen}
            options={{title:"History"}}
            />
            <Stack.Screen
            name="Report" component={ReportScreen}
            options={{title:"Report"}}
            />

            <Stack.Screen
              name="GenerateReceipt"
              component={GenerateReceiptScreen}
              options={{ title: "Generate Receipt" }}
            />
            <Stack.Screen
              name="LocationSelection"
              component={LocationSelectionScreen} // Ensure this component is correctly referenced
            />
            <Stack.Screen
              name="PaymentStatus"
              component={LocationSelectionScreen}
              initialParams={{
                type: "payment",
                locations: [
                  { id: "cash", name: "Cash" },
                  { id: "pending", name: "Pending" },
                ],
              }}
            />
            <Stack.Screen
              name="ReceiptPreview"
              component={ReceiptPreview}
              options={{ title: "Receipt Preview" }}
            />
          </>
        ) : (
          // Unauthenticated Screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>

        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
