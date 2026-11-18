import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DefaultLayout from '../layout/DefaultLayout'
import Landpage from '../pages/landpage/Landpage';
import Movies from '../pages/movies/Movies';
import MovieDetails from '../pages/movies/MovieDetails';
import Login from '../pages/login/Login';
import Profile from '../pages/profile/Profile';
import RequestMovie from '../pages/movies/RequestMovie'
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<Landpage />} />
          <Route path='movies' element={<Movies />} />
          <Route path='movies/:id' element={<MovieDetails />} />
          <Route
            path='profile'
            element={
              <ProtectedRoute fallbackPath="/login">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path='request'
            element={
              <ProtectedRoute fallbackPath="/login">
                <RequestMovie />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path='login'
          element={
            <PublicRoute authenticatedPath="/">
              <Login />
            </PublicRoute>
          }
        />
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}