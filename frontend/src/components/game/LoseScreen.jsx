export default function LoseScreen({ onPlayAgain }) {
  return (
    <>
      <h1>You lost!</h1>
      <h2>The Pokémon evaded capture...</h2>
      <h2>
        <img
          src="/images/pokeball_open.ico"
          width="180px"
          height="200px"
          style={{ imageRendering: 'pixelated' }}
          alt="Empty Poké Ball"
        />
      </h2>
      <button
        className="btn btn-primary"
        type="button"
        style={{ width: 200, height: 140, fontSize: 30 }}
        onClick={onPlayAgain}
      >
        Play again!
      </button>
    </>
  );
}