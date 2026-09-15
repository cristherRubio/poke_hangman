const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function LetterGrid({ guessedLetters, onGuess, disabled }) {
  return (
    <div>
      {ALPHABET.split('').map((letter) => {
        const used = guessedLetters.includes(letter);
        return (
          <button
            key={letter}
            className="letter-button"
            disabled={used || disabled}
            onClick={() => onGuess(letter)}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}