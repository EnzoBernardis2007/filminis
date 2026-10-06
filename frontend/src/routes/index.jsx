import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DefaultLayout from '../layout/DefaultLayout'
import Landpage from '../pages/landpage/Landpage';


export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<Landpage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}