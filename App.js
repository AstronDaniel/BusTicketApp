import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import AppNavigator from "./navigation/AppNavigator";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import { StatusBar } from 'react-native';
import './config/firebase'; // Ensure Firebase is initialized

const theme = {
  ...DefaultTheme,
  roundness: 8, // added
  colors: {
    ...DefaultTheme.colors,
    primary: "#4CAF50",
    accent: "#2196F3",
    background: "#f5f5f5",
  },
};

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
      </PaperProvider>
    </AuthProvider>
  );
}
