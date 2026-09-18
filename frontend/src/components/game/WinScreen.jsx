import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { titleCase } from '../../utils/text';

export default function WinScreen({ pokemonName, spriteUrl, onPlayAgain }) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <h1>You won!</h1>
      <h2>{titleCase(pokemonName)} captured!</h2>
      <h3>
        <img
          src={spriteUrl}
          width="300px"
          className="sprite-swirl"
          style={{ imageRendering: 'pixelated' }}
          alt={pokemonName}
        />
      </h3>

      {isAuthenticated ? (
        <>
          <Link to="/profile">
            <button
              className="btn btn-primary"
              type="button"
              style={{ width: 200, height: 140, fontSize: 20 }}
            >
              Pokédex
            </button>
          </Link>
          <button
            className="btn btn-primary"
            type="button"
            style={{ width: 200, height: 140, fontSize: 20 }}
            onClick={onPlayAgain}
          >
            Play again!
          </button>
        </>
      ) : (
        <>
          <button
            className="btn btn-primary"
            type="button"
            style={{ width: 200, height: 140, fontSize: 20 }}
            onClick={onPlayAgain}
          >
            Play again!
          </button>
          <p>
            NOTE: You need to <Link to="/register">register</Link> to save
            your progress!
          </p>
        </>
      )}
    </>
  );
}