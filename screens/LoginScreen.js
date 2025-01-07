import React, { useState, useContext } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import { AuthContext } from "../contexts/AuthContext";
import { loginUser } from "../services/auth.service";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    NetInfo.fetch().then(async state => {
      if (state.isConnected) {
        // Online login
        try {
          await login(email, password);
          setLoading(false);
        } catch (error) {
          console.error("Login User Error:", error.message);
          
          if (error.message.includes('network-request-failed')) {
            Alert.alert("Network Issue", "Please connect to a stable network to login.");
          } else if (error.message.includes('wrong-password') || error.message.includes('user-not-found')) {
            Alert.alert("Login Failed", "Invalid email or password.");
          } else {
            Alert.alert("Login Failed", "An unexpected error occurred. Please try again.");
          }
          setLoading(false);
        }
      } else {
       
        // Offline login using local data
        try {
          const localData = await AsyncStorage.getItem('userData');
        
          if (localData) {
            const localUserData = JSON.parse(localData);
            if (localUserData.email === email && localUserData.password === password) {  
             
              
              login(localUserData); // Set the user context with local data
              setLoading(false);
            } else {
              Alert.alert("Login Failed", "Invalid email or password.");
              setLoading(false);
            }
          } else {
            Alert.alert("Login Failed", "No local data found. Please connect to the internet and try again.");
            setLoading(false);
          }
        } catch (error) {
          console.error("Offline Login Error:", error);
          Alert.alert("Login Failed", "An error occurred while accessing local data.");
          setLoading(false);
        }
      }
    }).catch(error => {
      console.error("Network Status Error:", error);
      setLoading(false);
    });
  };

  return (
    <LinearGradient
      colors={['#E8F0FF', '#F5E6FF', '#FFE6E6']}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animatable.View 
            animation="fadeIn" 
            duration={1000} 
            style={styles.headerContainer}
          >
            <Image
              source={require('../assets/logo.png')}  // Add your logo image
              style={styles.logo}
            />
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </Animatable.View>

          <Animatable.View 
            animation="fadeInUpBig"
            duration={1000} 
            style={styles.formContainer}
          >
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="your@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Enter password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

           {/** <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
**/}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <LinearGradient
                colors={['#6B4EFF', '#9747FF']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
{/** 
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => navigation.navigate("Register")}
            >
              <Ionicons name="person-add-outline" size={20} color="#6B4EFF" style={styles.registerIcon} />
              <Text style={styles.registerButtonText}>Create New Account</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>By continuing, you agree to our </Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.footerText}> and </Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
**/}
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#6B4EFF",
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  gradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  registerIcon: {
    marginRight: 10,
  },
  registerButtonText: {
    color: '#6B4EFF',
    fontSize: 16,
    fontWeight: '500',
  },
  footerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  footerLink: {
    fontSize: 12,
    color: '#6B4EFF',
    fontWeight: '500',
  },
});

export default LoginScreen;