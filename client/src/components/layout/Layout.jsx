import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import AutoConsultationPopup from './AutoConsultationPopup.jsx';

/** Wraps every public marketing page with the shared header/footer. */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AutoConsultationPopup />
    </div>
  );
}
