import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDTcK9zqnnn5lTM-Zy-gVvnEhLPJao8Ceo",
  authDomain: "transportation-9c419.firebaseapp.com",
  projectId: "transportation-9c419",
  storageBucket: "transportation-9c419.appspot.com",
  messagingSenderId: "211686347209",
  appId: "1:211686347209:android:0211980352b6618c711818"
};

if (!firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    // Set Firestore settings
    db.settings({ ignoreUndefinedProperties: true});
    db.enablePersistence()
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.error('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.error('The current platform does not support persistence. Falling back to memory cache.');
        } else {
          console.error('Error enabling persistence:', err);
        }
      });
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;