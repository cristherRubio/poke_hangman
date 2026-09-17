import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { titleCase } from '../utils/text';

export default function Profile() {
  const { authFetch, user } = useAuth();

  const [pokedex, setPokedex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authFetch('/users/me/pokedex');
        if (!cancelled) setPokedex(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load your Pokédex.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <>
      <h1>Pokédex</h1>
      <h2><span style={{ color: 'gray' }}>Pokémon master: </span></h2>
      <h2>{user?.username}</h2>
      <h3><span style={{ color: 'gray' }}>Pokémon:</span></h3>
      <h3>{pokedex.count}</h3>

      <div className="card-group">
        {pokedex.pokemon.map((pokemon) => (
          <div className="card custom-card" key={pokemon.id}>
            <img
              className="card-img-top"
              src={pokemon.sprite_url}
              style={{ imageRendering: 'pixelated' }}
              alt={pokemon.name}
            />
            <div className="card-body">
              <h5 className="card-title">
                <span style={{ color: 'gray' }}>Name: </span>
                {titleCase(pokemon.name)}
              </h5>
              <p className="card-text">
                <span style={{ color: 'gray' }}>Type: </span>
                {pokemon.types.map(titleCase).join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}