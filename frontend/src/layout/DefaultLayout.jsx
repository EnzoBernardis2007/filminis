import styles from './default-layout.module.css'
import { Outlet } from 'react-router-dom';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';

function DefaultLayout() {
  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.stretcher}>
        <div className={styles.maxWidth}>
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default DefaultLayout