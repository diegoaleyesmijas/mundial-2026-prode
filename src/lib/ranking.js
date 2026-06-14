const getMatchOutcome = (match) => {
  if (match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore > match.awayScore) return 'HOME';
  if (match.homeScore < match.awayScore) return 'AWAY';
  return 'DRAW';
};

const FINAL_POINTS = {
  champion: 10,
  runner_up: 6,
  third_place: 4,
  fourth_place: 2,
  top_scorer: 5,
};

export function computeLeagueRanking(matches, predictions, members) {
  const finishedMatches = matches.filter(
    (match) => match.status === 'FINISHED' && match.homeScore != null && match.awayScore != null,
  );

  return members
    .map((member) => {
      const userPredictions = predictions[member] || {};
      const details = finishedMatches.reduce(
        (acc, match) => {
          const correctOutcome = getMatchOutcome(match);
          const predictedOutcome = userPredictions[match.id];
          if (!correctOutcome) return acc;
          const isCorrect = predictedOutcome === correctOutcome;
          return {
            points: acc.points + (isCorrect ? 3 : 0),
            correct: acc.correct + (isCorrect ? 1 : 0),
            played: acc.played + 1,
          };
        },
        { points: 0, correct: 0, played: 0 },
      );

      return {
        member,
        points: details.points,
        correct: details.correct,
        played: details.played,
      };
    })
    .sort((a, b) => b.points - a.points || b.correct - a.correct || a.member.localeCompare(b.member));
}

export function computeFinalPredictionPoints(finalPredictions, members) {
  // Final predictions are locked but results are not known until tournament ends.
  // For now, prepare the structure — actual results will be added later.
  // Returns: { [member]: { champion, runner_up, third_place, fourth_place, points } }
  const result = {};
  members.forEach((member) => {
    const userFinal = finalPredictions[member] || {};
    const picks = {
      champion: userFinal.champion || null,
      runner_up: userFinal.runner_up || null,
      third_place: userFinal.third_place || null,
      fourth_place: userFinal.fourth_place || null,
      top_scorer: userFinal.top_scorer || null,
    };
    const selections = Object.values(picks).filter(Boolean).length;
    result[member] = {
      ...picks,
      points: 0, // Will be calculated when tournament ends
      hasSelections: selections > 0,
    };
  });
  return result;
}
