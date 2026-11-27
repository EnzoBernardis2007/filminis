import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DefaultLayout from '../layout/DefaultLayout'
import Landpage from '../pages/landpage/Landpage';
import Movies from '../pages/movies/Movies';
import MovieDetails from '../pages/movies/MovieDetails';
import MovieEdit from '../pages/movies/MovieEdit';
import Login from '../pages/login/Login';
import Profile from '../pages/profile/Profile';
import RequestMovie from '../pages/movies/RequestMovie'
import Approval from '../pages/approval/Approval'
import { ProtectedRoute, PublicRoute, AdminProtectedRoute } from '../components/ProtectedRoute';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<Landpage />} />
          <Route path='movies' element={<Movies />} />
          <Route path='movies/:id' element={<MovieDetails />} />
          <Route
            path='movies/:id/edit'
            element={
              <AdminProtectedRoute>
                <MovieEdit />
              </AdminProtectedRoute>
            }
          />
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
          <Route
            path='approval'
            element={
              <ProtectedRoute fallbackPath="/login">
                <Approval />
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