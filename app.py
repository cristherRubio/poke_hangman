import re
import os
import random
from flask import Flask, render_template, request, redirect, url_for, session, flash, get_flashed_messages
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

from models import db
from models import User, Pokemon, UserPokemon

def create_app():
    app = Flask(__name__)
    app.secret_key = 'your_secret_key'  # Change this to a random value
     # Determine the database path based on the environment
    if os.getenv('PYTHONANYWHERE_ENV'):
        # Running on PythonAnywhere
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'pokehang.db')
    else:
        # Running locally
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pokehang.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    with app.app_context():
        db.create_all()
    return app


app = create_app()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        username = username.strip()
        password = password.strip()

        # Password validation REGEX provided by ChatGPT
        if not re.match(r'^(?=.*[A-Za-z]{4})(?=.*\d)[A-Za-z\d]{5,}$', password):
            flash('Password must contain at least 4 letters and 1 number.', 'danger')
            return redirect(url_for('register'))

        existing_user = User.query.filter_by(username=username).first()
        print(existing_user)
        if existing_user:
            flash('Username already exists. Please choose a different one.', 'danger')
            return redirect(url_for('register'))

        hashed_password = generate_password_hash(password)

        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        flash('You have successfully registered! Please log in.')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        username = username.strip()
        password = password.strip()

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_name'] = user.username  # Set the user_name attribute in the session
            flash('You have successfully logged in!', 'success')
            return redirect(url_for('profile'))
        else:
            flash('Invalid username or password. Please try again.', 'danger')

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('index'))

@app.route('/profile')
def profile():
    if 'user_id' in session:
        user = User.query.filter_by(id=session['user_id']).first()
        pokedex_q = UserPokemon.query.filter_by(user_id=session['user_id']).all()
        pokedex_ids = [user_pokemon.pokemon_id for user_pokemon in pokedex_q]
        pokedex = Pokemon.query.filter(Pokemon.id.in_(pokedex_ids)).all()  #ChatGPT
        poke_count = len(pokedex)
        poke_types = set(sorted([pokemon.type for pokemon in pokedex]))
        return render_template('profile.html', pokedex=pokedex, poke_count=poke_count, poke_types=poke_types)
    else:
        flash('You need to log in first.', 'error')
        return redirect(url_for('login'))

# ChatGPT provided a lot of help with the session variables.
@app.route('/game', methods=['GET', 'POST'])
def game():
    if request.method == 'GET':
        pokemon_id, pokemon, pokemon_url, attempts, guessed_chars = initialize_game()
        session['pokemon_id'] = pokemon_id
        session['pokemon'] = pokemon
        session['pokemon_url'] = pokemon_url
        session['attempts'] = attempts
        session['guessed_chars'] = guessed_chars
        session['used_letters'] = []
        used_letters = []
    else:
        pokemon_id = session['pokemon_id']
        pokemon = session['pokemon']
        pokemon_url = session['pokemon_url']
        attempts = session['attempts']
        guessed_chars = session['guessed_chars']
        used_letters = session['used_letters']

        if attempts <= 1:
            session['redirected_from_game'] = True
            return redirect(url_for('lose'))

        letter_guess = request.form['letter'].upper()

        if letter_guess in used_letters:
            return redirect(url_for('game'))
        
        used_letters.append(letter_guess)

        if letter_guess in pokemon:
            guessed_chars.append(letter_guess)
        else:
            attempts -= 1

        session['attempts'] = attempts
        session['guessed_chars'] = guessed_chars
        session['used_letters'] = used_letters

    regex = r'[^ ' + "".join(guessed_chars) + r']'
    regex_sub = re.sub(regex, '_', pokemon)
    print(pokemon)

    if pokemon == regex_sub:
        session['redirected_from_game'] = True
        return redirect(url_for('win', captured_pokemon=pokemon_id))

    return render_template('game.html', regex_sub=regex_sub, used_letters=used_letters, attempts=attempts, pokemon_url=pokemon_url)

@app.route('/lose')
def lose():
    # Redirects to index - ChatGPT
    if session.get('redirected_from_game') != True:
        flash('You can only access the lose route from the game route.', 'warning')
        return redirect(url_for('index'))
    # Check if the user has been redirected from the game route
    return render_template('lost.html')

@app.route('/win')
def win():
    # Redirects to index - ChatGPT
    if session.get('redirected_from_game') != True:
        flash('You can only access the win/ route from the game route.', 'warning')
        return redirect(url_for('index'))
    
    # Win display
    pokemon_id = request.args.get('captured_pokemon')  #ChatGPT
    pokemon = Pokemon.query.filter(Pokemon.id == pokemon_id).first()
    pokemon_name = pokemon.name
    pokemon_img = pokemon.sprite_url
    pokemon_var = pokemon.end_url
    # If log in, add pokemon to user
    if 'user_id' in session:
        user = User.query.filter_by(id=session['user_id']).first()
        combination_exists = UserPokemon.query.filter_by(user_id=user.id, pokemon_id=pokemon_id).first()
        if not combination_exists: 
            pokemon_capture = UserPokemon(user_id=user.id, pokemon_id=pokemon_id)
            db.session.add(pokemon_capture)
            db.session.commit()
    return render_template('won.html', pokemon_name=pokemon_name, pokemon_img=pokemon_img, pokemon_var=pokemon_var)

def initialize_game():
    #ChatGPT
    if 'user_id' in session:
        user = User.query.filter_by(id=session['user_id']).first()
        user_pokemon = UserPokemon.query.filter_by(user_id=user.id).all()
        user_pokemon_ids = [pk.pokemon_id for pk in user_pokemon]
        non_captd_pokemon = Pokemon.query.filter(~Pokemon.id.in_(user_pokemon_ids)).all()
        pokemon = random.choice(non_captd_pokemon)
        pokemon_id = pokemon.id
        pokemon_name = pokemon.name.upper()
        pokemon_url = pokemon.sprite_url
        attempts = (len(pokemon_name) // 2) + 1
    else:
        all_pokemon = Pokemon.query.all()
        pokemon = random.choice(all_pokemon)
        pokemon_id = pokemon.id
        pokemon_name = pokemon.name.upper()
        pokemon_url = pokemon.sprite_url
        attempts = (len(pokemon_name) // 2)
    if ' ' in pokemon_name:
        return pokemon_id, pokemon_name, pokemon_url, attempts, [' ']
    else:
        return pokemon_id, pokemon_name, pokemon_url, attempts, []

def reset_game():
    #ChatGPT
    session.pop('rndm_pokemon_id', None)
    session.pop('letters', None)
    session.pop('guessed_chars', None)
    session.pop('attempts', None)

@app.route('/about')
def about():
    return render_template('about.html')

# Custom 404 error handler
@app.errorhandler(404)
def page_not_found(e):
    # Render the custom 404 page
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True)