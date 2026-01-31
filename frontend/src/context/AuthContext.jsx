import { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const { user: clerkUser, isLoaded, isSignedIn } = useUser();
    const { signOut, openSignIn } = useClerk();
    const [backendUser, setBackendUser] = useState(null);

    // Derived full user object
    const user = isSignedIn ? { ...clerkUser, ...backendUser } : null;

    useEffect(() => {
        const syncUser = async () => {
            if (isSignedIn && clerkUser) {
                try {
                    // Get token handled by API interceptor, but we need to wait for it to be ready
                    // We can just call the API
                    const { data } = await api.post('/users/me', {
                        email: clerkUser.primaryEmailAddress?.emailAddress
                    });

                    if (data.success) {
                        setBackendUser(data.data);
                    }
                } catch (error) {
                    console.error("Failed to sync user with backend:", error);
                }
            } else {
                setBackendUser(null);
            }
        };

        syncUser();
    }, [isSignedIn, clerkUser]);

    const login = () => openSignIn();
    const logout = () => signOut();

    return (
        <AuthContext.Provider value={{ user, loading: !isLoaded, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
