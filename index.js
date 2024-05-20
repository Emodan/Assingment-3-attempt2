// server.js
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

const POKEMON_PER_PAGE = 9;

app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * POKEMON_PER_PAGE;

    const [pokemonResponse, typesResponse] = await Promise.all([
      axios.get('https://pokeapi.co/api/v2/pokemon?limit=810'),
      axios.get('https://pokeapi.co/api/v2/type')
    ]);

    let pokemonList = pokemonResponse.data.results;
    const typesList = typesResponse.data.results;

    if (req.query.type1 || req.query.type2) {
      const selectedTypes = [req.query.type1, req.query.type2].filter(Boolean);
      const typePromises = selectedTypes.map(type =>
        axios.get(`https://pokeapi.co/api/v2/type/${type}`)
      );

      const typeResponses = await Promise.all(typePromises);
      const pokemonOfSelectedTypes = typeResponses.map(response =>
        response.data.pokemon.map(p => p.pokemon.name)
      );

      // Filter Pokémon that have both selected types
      pokemonList = pokemonList.filter(p =>
        pokemonOfSelectedTypes.every(typeList => typeList.includes(p.name))
      );
    }

    const totalFilteredPokemon = pokemonList.length;
    const filteredPokemonList = pokemonList.slice(offset, offset + POKEMON_PER_PAGE);
    const detailedPokemonList = await Promise.all(
      filteredPokemonList.map(async (pokemon) => {
        const details = await axios.get(pokemon.url);
        return details.data;
      })
    );

    const totalPages = Math.ceil(totalFilteredPokemon / POKEMON_PER_PAGE);

    res.render('index', { 
      pokemonList: detailedPokemonList, 
      typesList, 
      selectedType1: req.query.type1 || '', 
      selectedType2: req.query.type2 || '', 
      currentPage: page, 
      totalPages,
      totalPokemon: totalFilteredPokemon,
      displayedPokemonCount: detailedPokemonList.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching Pokémon data');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
