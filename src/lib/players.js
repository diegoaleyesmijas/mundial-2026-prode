const topScorersList = [
  { team: 'Francia', players: ['Kylian Mbappé', 'Ousmane Dembélé'] },
  { team: 'Inglaterra', players: ['Harry Kane', 'Bukayo Saka'] },
  { team: 'Noruega', players: ['Erling Haaland'] },
  { team: 'Argentina', players: ['Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez'] },
  { team: 'España', players: ['Lamine Yamal', 'Mikel Oyarzabal'] },
  { team: 'Brasil', players: ['Vinícius Júnior'] },
  { team: 'Portugal', players: ['Cristiano Ronaldo'] },
  { team: 'Egipto', players: ['Omar Marmoush'] },
  { team: 'Colombia', players: ['Luis Díaz'] },
  { team: 'Alemania', players: ['Nick Woltemade', 'Florian Wirtz'] },
];

export function getAllPlayers() {
  return topScorersList.flatMap((entry) => entry.players);
}

export function getPlayerSuggestions() {
  return topScorersList;
}
