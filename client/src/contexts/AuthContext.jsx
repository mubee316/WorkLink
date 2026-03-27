import { createContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(email, password, name, role, phoneNumber, workerProfile = {}) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: name });

    const profileData = {
      uid: user.uid,
      name,
      email,
      phoneNumber,
      role,
      createdAt: new Date().toISOString(),
      ...(role === 'worker' && {
        bio: workerProfile.bio || '',
        skills: workerProfile.skills || [],
        hourlyRate: workerProfile.hourlyRate || 0,
        area: workerProfile.area || '',
        yearsOfExperience: workerProfile.yearsOfExperience || '',
        isAvailable: true,
        photoURL: '',
        avgRating: 0,
        totalJobs: 0,
        reviewCount: 0,
      }),
    };

    await setDoc(doc(db, 'users', user.uid), profileData);
    setUserProfile(profileData);
    return user;
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setUserProfile(snap.data());
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, userProfile, register, login, logout, resetPassword, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
