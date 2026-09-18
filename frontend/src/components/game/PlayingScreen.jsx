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
}) {
  return (
    <>
      <h1>Play!</h1>
      <h2>Who's that Pokémon?</h2>

      <Hearts total={maxAttempts} remaining={attemptsRemaining} />

      <img
        src={spriteUrl}
        width="300px"
        style={{ imageRendering: 'pixelated', filter: 'brightness(0.00)' }}
        alt="Mystery Pokémon silhouette"
      />

      <h2 id="pokemon-name">{maskedName}</h2>

      <LetterGrid
        guessedLetters={guessedLetters}
        onGuess={onGuess}
        disabled={isSubmitting}
      />
    </>
  );
}