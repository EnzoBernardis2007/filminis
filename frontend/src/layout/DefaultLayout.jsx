import './default-layout.css'
import { Outlet } from 'react-router-dom';
import Header from '../components/header/Header';

function DefaultLayout() {
  return (
    <div>
      <Header />

      <main>
        <Outlet />
      </main>

      <footer>
        <p>&copy; 2026 - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

export default DefaultLayout