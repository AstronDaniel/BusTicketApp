import React, { createContext, useState, useEffect } from "react";
import { auth } from '../config/firebase'; // Adjust the import to your config
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User is null when not logged in.

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Function to log in the user.
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  // Function to log out the user.
  const logout = () => {
    auth.signOut(); // This will trigger the onAuthStateChanged listener to update the user state.
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};