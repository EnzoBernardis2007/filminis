import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DefaultLayout from '../layout/DefaultLayout'
import Landpage from '../pages/landpage/Landpage';
import Movies from '../pages/movies/Movies';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultLayout />}>
          <Route path='/doida' element={<Landpage />} />
          <Route index element={<Movies />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}