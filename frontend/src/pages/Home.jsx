import { Link, useLocation } from 'react-router-dom';

export default function Home() {
  const location = useLocation();
  const flash = location.state?.flash; // { category: 'success' | 'danger' | ..., message: string }

  return (
    <>
      {flash && (
        <div className={`alert alert-${flash.category}`} role="alert">
          {flash.message}
        </div>
      )}

      <h1>Poké-Hangman</h1>
      <h3>Gotta catch'em all!</h3>

      <Link to="/game">
        <button
          className="btn btn-primary"
          type="button"
          style={{ width: 200, height: 140, fontSize: 30 }}
        >
          Play
        </button>
      </Link>

      <p>
        NOTE: You need to <Link to="/register">register</Link> to save your
        captured Pokémon!
      </p>
    </>
  );
}