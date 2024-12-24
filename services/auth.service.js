import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, query, where, getDocs, collection } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";

export const registerUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, phone } = userData;

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // Check if the email already exists locally
    const localData = await AsyncStorage.getItem('userData');
    if (localData) {
      const localUserData = JSON.parse(localData);
      if (localUserData.email === email) {
        throw new Error("Email already exists locally. Please use a different email.");
      }
    }

    // Check if the email already exists remotely
    const userQuery = query(collection(db, 'users'), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    if (!userSnapshot.empty) {
      throw new Error("Email already exists. Please use a different email.");
    }

    // Create user in Firebase Authentication
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/network-request-failed') {
        // Store user data locally for offline registration
        await AsyncStorage.setItem('userData', JSON.stringify({ ...userData, synced: false }));
        console.log("User registered offline. Data will be synced when network is available.");
        return;
      } else {
        console.log(error);
      }
    }

    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', email), {
      firstName,
      lastName,
      email,
      phone,
      createdAt: new Date().toISOString()
    });

    // Store user data locally
    await AsyncStorage.setItem('userData', JSON.stringify({ ...userData, synced: true }));

    return userCredential.user;
  } catch (error) {
    console.error("Register User Error:", error);
    throw error;
  }
};

export const syncData = async () => {
  const storedData = await AsyncStorage.getItem('userData');
  if (storedData) {
    try {
      const userData = JSON.parse(storedData);
      if (!userData.synced) {
        // Check if the user already exists in Firebase Authentication
        const signInMethods = await fetchSignInMethodsForEmail(auth, userData.email);
        if (signInMethods.length === 0) {
          // Create user in Firebase Authentication
          await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        }

        // Store additional user data in Firestore
        await setDoc(doc(db, 'users', userData.email), userData);
        console.log("Data synced with Firebase successfully!");

        // Mark data as synced
        await AsyncStorage.setItem('userData', JSON.stringify({ ...userData, synced: true }));
      }
    } catch (error) {
      console.error("Sync Data Error:", error);
    }
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login User Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout User Error:", error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Reset Password Error:", error);
    throw error;
  }
};