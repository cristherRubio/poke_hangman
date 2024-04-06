# Pokemon hangman
#### Video Demo: https://cristherrubio.pythonanywhere.com/
#### Description:
It was an extremely fun project to create, but also frustrating at times. I decided to do this web app because it would allow me to be a little corky, and though I'm not a Pokemon fan, I do have a lot of friends who are; also, surely enough the Pokemon API that was used provided a very easy and simple way to stick to the initial idea.

The start of the project did not regard design, only functionality. The initial implementation was the register, log-in, and log-out routes and HTML's; using what we did in the finance project as a guide. As development progressed I saw the need for a database (DB), chose SQLite3, and then created a very simple table for users and Pokemon, quickly realizing another table to relate those two was in need. It was because of this that I discovered SQLAlchemy's Object Relational Mapper (ORM), which abstracts a lot of the SQL queries needed as models and classes, which was an incredible breakthrough. 

I then proceeded to create a script with the full mechanics of a hangman game, though implementing the interaction with HTML proved way harder than I thought (this is where ChatGPT helped the most). Shortly after this, the scripts for requesting all Pokemon (and their relevant data) and another one to populate the Pokemon model in the DB were created.

The design of the page was a reminiscence of the '90s games, which was conveniently ad-hoc to the sprites the API provides. I took the Pokemon retro logo as well as a screenshot of the Gameboy's first game to create the color scheme and to find the pixel font.

At last, the Pokemon-hangman web app was finished, not without noticing that the interaction directly for the letter buttons is janky because I did not use AJAX (apparently), which I don´t know how to use but hopefully will learn soon.

## Table of Contents

- [Usage](#usage)
- [Project](#project)
- [Disclaimer](#disclaimer)
- [Credits](#credits)

## Usage

Just go to my [pythonanywhere](https://cristherrubio.pythonanywhere.com/) and start using the web app. You do need to register to save your progress.

## Project

The structure and description of the project directory.

- **scripts/**
  - *hangman.py* Contains the standalone hangman mechanics.
  - *INIT_pokemon_api.py* Requests [PokéAPI](https://pokeapi.co/) to create static/pokemon_data.csv

- **static/**
  - *fonts/* Contains the special fonts used.
  - *gifs/* Contains the GIF used below the navbar.
  - *images/* Contains the images used in the web app.
  - *pokemon_data.csv* Contains the data to populate the Pokemon table.
  - *styles.css* Contains the styles definition in CSS for the web app.

- **templates/**
  - *404.html* Not found page.
  - *about.html* Disclaimer and credits page.
  - *game.html* Game page. 
  - *index.html* Landing page.
  - *layout.html* Base page, imported by every page.
  - *login.html* Login page.
  - *logout.html* Logout page.
  - *lost.html* Game redirects here if player loses.
  - *profile.html* Pokedex page, displays all of the captured Pokemon for a user.
  - *register.html* Registration page.
  - *won.html* Game redirects here if player wins.

- **.gitignore** Determines dirs and files to ignore.

- **.python-version** Python version used, created with Pyenv.

- **app.py** Flask app containing all of the logic for the back-end.

- **INIT_pokemon_populate.py** Populates the Pokemon table after the creation of the app instance created by Flask. Gets data from *static/pokemon_data.csv*.

- **models.py** Class creation for SQLAlchemy models.

- **README.md** This file.

- **requirements.txt** Python dependencies and libraries used in the project, needed to recreate venv.

## Disclaimer

This Pokémon Hangman web app is a fan-made project and is not affiliated with or endorsed by Nintendo, Game Freak, or The Pokémon Company. Pokémon and all related trademarks are the property of their respective owners. The content within this web app, including but not limited to Pokémon names, images, and other related materials, are used under the principles of fair use for educational and entertainment purposes only. We do not claim ownership over any copyrighted material belonging to Pokémon.

By using this web app, you agree to the following:

- You will not use this web app for any commercial purposes.
- You understand that all Pokémon-related content within this web app is the intellectual property of Nintendo, Game Freak, and The Pokémon Company.
- You will not attempt to redistribute or modify any content from this web app for personal gain.
- You accept that this web app is provided on an "as is" and "as available" basis, and we make no warranties regarding its functionality or suitability for any particular purpose.

## Credits

- Made with Python (Flask), HTML (Bootstrap), and CSS; as the final project for [CS50x](https://cs50.harvard.edu/x/2024/).
- Concept and Development: Cristher Rubio ([project repo](https://github.com/cristherRubio/pokemon_hangman))
- QA and testing: Fernando Brito
- Pokémon Data and sprites: [PokéAPI](https://pokeapi.co/)
- Graphics & fonts:
  - Pokémon pixel font: [Fonts2u](https://es.fonts2u.com/pokemon-pixel-font-regular.fuente)
  - Pokémon logo: [Pixelartmaker](https://pixelartmaker.com/art/d98dde45d242734)
  - Pokeball icon: [Pngitem](https://www.pngitem.com/middle/iohiww_pokeball-pixel-art-clipart-png-download-pokemon-ball/)
  - Ash running GIF: [Deviantart](https://www.deviantart.com/the-otaku-dude326/art/PT-Running-Animation-290157303)
  - Pixel hearts: [Freesvg](https://freesvg.org/heart-svg-pixel-art)
  - Open pokeball: [Deviantart](https://www.deviantart.com/blacklem00n)