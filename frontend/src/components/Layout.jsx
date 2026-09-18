import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const location = useLocation();
  const showFooter = location.pathname !== '/about';

  return (
    <>
      <Navbar />

      <main className="container-fluid text-center">{children}</main>

      {showFooter && (
        <footer className="mb-5 small text-center text-muted">
          Data from <a href="https://pokeapi.co/">PokéAPI</a>
        </footer>
      )}
    </>
  );
}