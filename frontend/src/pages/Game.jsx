import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PlayingScreen from '../components/game/PlayingScreen';
import WinScreen from '../components/game/WinScreen';
import LoseScreen from '../components/game/LoseScreen';

export default function Game() {
  const { authFetch } = useAuth();

  const [game, setGame] = useState(null); // { gameToken, maskedName, guessedLetters, attemptsRemaining, spriteUrl, status, pokemonName }
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const startNewGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsRevealed(false);
    try {
      // Game routes take an optional bearer - authFetch still attaches the
      // token if we have one (for the bonus attempt / auto-capture), but
      // won't force a login redirect if we don't.
      const data = await authFetch('/game/new', { auth: 'optional' });
      setGame({
        gameToken: data.game_token,
        maskedName: data.masked_name,
        guessedLetters: [],
        attemptsRemaining: data.attempts_remaining,
        maxAttempts: data.max_attempts,
        spriteUrl: data.sprite_url,
        status: 'playing',
        pokemonName: null,
      });
    } catch (err) {
      setError(err.message || 'Could not start a new game.');
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleHint = async (reveal = false) => {
    if (isSubmitting || !game || game.status !== 'playing') return;
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await authFetch('/game/hint', {
        method: 'POST',
        auth: 'optional',
        body: JSON.stringify({ game_token: game.gameToken, reveal }),
      });
      setGame((prev) => ({
        ...prev,
        gameToken: data.game_token,
        maskedName: data.masked_name,
        guessedLetters: data.guessed_letters,
        attemptsRemaining: data.attempts_remaining,
        status: data.status,
        pokemonName: data.pokemon_name,
        spriteUrl: data.sprite_url || prev.spriteUrl,
      }));
      if (reveal) setIsRevealed(true);
    } catch (err) {
      setError(err.message || 'Could not get a hint - try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuess = async (letter) => {
    if (isSubmitting || !game || game.status !== 'playing') return;
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await authFetch('/game/guess', {
        method: 'POST',
        auth: 'optional',
        body: JSON.stringify({ game_token: game.gameToken, letter }),
      });
      setGame((prev) => ({
        ...prev,
        gameToken: data.game_token,
        maskedName: data.masked_name,
        guessedLetters: data.guessed_letters,
        attemptsRemaining: data.attempts_remaining,
        status: data.status,
        pokemonName: data.pokemon_name,
        spriteUrl: data.sprite_url || prev.spriteUrl,
      }));
    } catch (err) {
      setError(err.message || 'That guess did not go through - try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (error && !game) {
    return (
      <>
        <h2>Something went wrong</h2>
        <p className="text-muted">{error}</p>
        <button className="btn btn-primary" onClick={startNewGame}>
          Try again
        </button>
      </>
    );
  }

  return (
    <>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {game.status === 'playing' && (
        <PlayingScreen
          maskedName={game.maskedName}
          attemptsRemaining={game.attemptsRemaining}
          maxAttempts={game.maxAttempts}
          spriteUrl={game.spriteUrl}
          guessedLetters={game.guessedLetters}
          onGuess={handleGuess}
          isSubmitting={isSubmitting}
          onHint={() => handleHint(false)}
          onReveal={() => handleHint(true)}
          isRevealed={isRevealed}
        />
      )}

      {game.status === 'won' && (
        <WinScreen
          pokemonName={game.pokemonName}
          spriteUrl={game.spriteUrl}
          onPlayAgain={startNewGame}
        />
      )}

      {game.status === 'lost' && <LoseScreen onPlayAgain={startNewGame} />}
    </>
  );
}