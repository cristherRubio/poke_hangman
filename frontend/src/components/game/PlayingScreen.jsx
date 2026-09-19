import Hearts from './Hearts';
import LetterGrid from './LetterGrid';

export default function PlayingScreen({
  maskedName,
  maxAttempts,
  attemptsRemaining,
  spriteUrl,
  guessedLetters,
  onGuess,
  isSubmitting,
  onHint,
  onReveal,
  isRevealed,
}) {
  const canHint = attemptsRemaining > 1 && !isSubmitting;

  return (
    <>
      <h1>Play!</h1>
      <h2>Who's that Pokémon?</h2>

      <Hearts total={maxAttempts} remaining={attemptsRemaining} />

      <img
        src={spriteUrl}
        width="300px"
        style={{
          imageRendering: 'pixelated',
          filter: isRevealed ? 'none' : 'brightness(0.00)', // CHANGED
        }}
        alt={isRevealed ? 'Pokémon' : 'Mystery Pokémon silhouette'} // CHANGED
      />

      {/* NEW: hint buttons */}
      <div className="my-2">
        <button
          className="btn btn-secondary"
          onClick={onHint}
          disabled={!canHint}
        >
          Hint 
          <br />
          <small>(-1 ❤)</small>
        </button>
        <button
          className="btn btn-secondary"
          onClick={onReveal}
          disabled={!canHint || isRevealed}
        >
          Reveal Pokémon 
          <br />
          <small>(down to 1 ❤)</small>
        </button>
      </div>

      <h2 id="pokemon-name">{maskedName}</h2>

      <LetterGrid
        guessedLetters={guessedLetters}
        onGuess={onGuess}
        disabled={isSubmitting}
      />
    </>
  );
}