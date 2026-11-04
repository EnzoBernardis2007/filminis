import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DefaultLayout from '../layout/DefaultLayout'
import Landpage from '../pages/landpage/Landpage';
import Movies from '../pages/movies/Movies';
import Login from '../pages/login/Login';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<Landpage />} />
          <Route path='movies' element={<Movies />} />
        </Route>
        <Route path='login' element={<Login />}/>
      </Routes>
    </BrowserRouter>
  );
}