import { Navigate, Route, Routes } from 'react-router-dom';

import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/login/LoginPage';
import SignUpPage from './pages/auth/signup/SignUpPage';
import NotificationPage from './pages/notification/NotificationPage';
import ProfilePage from './pages/profile/ProfilePage';

import Sidebar from './components/common/Sidebar';
import RightPanel from './components/common/RightPanel';
import { Toaster } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  // Fetch authenticated user info using React Query
  const { data: authUser, isLoading, error, isError } = useQuery({
    queryKey: ['authUser'],  // Unique key to identify this query
    queryFn: async () => {
      try {
        const res = await fetch("api/auth/me");
        const data = await res.json();

        // If backend sends error inside JSON, treat as no user (null)
        if (data.error) return null;

        // Throw error if HTTP status is not OK
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        console.log("authUser is here: ", data);
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });

  // Show loading spinner while fetching user data
  if (isLoading) {
    return (
      <div className='h-screen flex justify-center items-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  // Log authenticated user data (for debugging)
  console.log(authUser);

  return (
    <div className='flex max-w-6xl mx-auto'>
      {/* Sidebar only shows when user is logged in */}
      {authUser && <Sidebar />}

      {/* Define app routes */}
      <Routes>
        {/* Home route: redirects to login if not authenticated */}
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />

        {/* Login route: redirects to home if already authenticated */}
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />

        {/* Signup route: redirects to home if already authenticated */}
        <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />

        {/* Notifications page: protected route */}
        <Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to="/login" />} />

        {/* User profile page: protected route */}
        <Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      {/* RightPanel only shows when user is logged in */}
      {authUser && <RightPanel />}

      {/* Toast notifications container */}
      <Toaster />
    </div>
  );
}

export default App;
