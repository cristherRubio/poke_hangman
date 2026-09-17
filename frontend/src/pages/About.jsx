export default function About() {
  return (
    <>
      <div>
        <h1>About</h1>
      </div>

      <div className="just-left" id="disclaimer">
        <h2>Disclaimer</h2>
        <p className="grayed">
          This Pokémon Hangman web app is a fan-made project and is not
          affiliated with or endorsed by Nintendo, Game Freak, or The Pokémon
          Company. Pokémon and all related trademarks are the property of
          their respective owners. The content within this web app,
          including but not limited to Pokémon names, images, and other
          related materials, are used under the principles of fair use for
          educational and entertainment purposes only. We do not claim
          ownership over any copyrighted material belonging to Pokémon.
        </p>
        <p className="grayed">By using this web app, you agree to the following:</p>
        <ul className="grayed">
          <li>You will not use this web app for any commercial purposes.</li>
          <li>
            You understand that all Pokémon-related content within this web
            app is the intellectual property of Nintendo, Game Freak, and The
            Pokémon Company.
          </li>
          <li>
            You will not attempt to redistribute or modify any content from
            this web app for personal gain.
          </li>
          <li>
            You accept that this web app is provided on an "as is" and "as
            available" basis, and we make no warranties regarding its
            functionality or suitability for any particular purpose.
          </li>
        </ul>
      </div>

      <div className="just-left" id="credits">
        <h2>Credits</h2>
        <p className="grayed">
          Made as the final
          project for{' '}
          <a href="https://cs50.harvard.edu/x/2024/">CS50x</a> course.
        </p>
        <ul className="grayed">
          <li>
            Concept and Development: Cristher Rubio{' '}
            <a href="https://github.com/cristherRubio/pokemon_hangman">
              (project repo)
            </a>
          </li>
          <li>QA and testing: Fernando Brito</li>
          <li>
            Pokémon Data and sprites: <a href="https://pokeapi.co/">PokéAPI</a>
          </li>
          <li>
            Graphics &amp; fonts:
            <ul>
              <li className="subli">
                Pokémon pixel font:{' '}
                <a href="https://es.fonts2u.com/pokemon-pixel-font-regular.fuente">
                  Fonts2u
                </a>
              </li>
              <li className="subli">
                Pokémon logo:{' '}
                <a href="https://pixelartmaker.com/art/d98dde45d242734">
                  Pixelartmaker
                </a>
              </li>
              <li className="subli">
                Pokeball icon:{' '}
                <a href="https://www.pngitem.com/middle/iohiww_pokeball-pixel-art-clipart-png-download-pokemon-ball/">
                  Pngitem
                </a>
              </li>
              <li className="subli">
                Ash running GIF:{' '}
                <a href="https://www.deviantart.com/the-otaku-dude326/art/PT-Running-Animation-290157303">
                  Deviantart
                </a>
              </li>
              <li className="subli">
                Pixel hearts:{' '}
                <a href="https://freesvg.org/heart-svg-pixel-art">Freesvg</a>
              </li>
              <li className="subli">
                Open pokeball:{' '}
                <a href="https://www.deviantart.com/blacklem00n">Deviantart</a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </>
  );
}