import pandas as pd
from app import create_app, db
from models import Pokemon

#TODO: Read pokemon_data and insert to Pokemon table
df = pd.read_csv('static/pokemon_data.csv')
print(len(df))
df = df[~df.sprite_url.isna()]
df = df[['name', 'type', 'end_url', 'sprite_url']]

# Compound names fix
regex = 'mr-mime|mime-jr|great-tusk'
mask = df.end_url.str.contains('-')
name_mask = df.end_url.str.contains(regex, regex=True)
res_name_mask = df[(mask) & (name_mask)].end_url.str.split('-').str[0] + ' ' + df[(mask) & (name_mask)].end_url.str.split('-').str[1]
df.loc[(mask) & (name_mask), 'name'] = res_name_mask

#col_names = ('name', 'type', 'end_url', 'sprite_url')
# ChatGPT -- Insert dataframe to DB
app = create_app()
with app.app_context():
    for row in df.itertuples():
        pokemon = Pokemon(name=row[1], type=row[2], end_url=row[3], sprite_url=row[4])
        db.session.add(pokemon)
    db.session.commit()