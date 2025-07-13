import React from 'react';

interface Game {
  date: string;
  score: number;
}

interface ScoreScatterPlotProps {
  games: Game[];
}

const ScoreScatterPlot: React.FC<ScoreScatterPlotProps> = ({ games }) => {
  if (!games || games.length === 0) {
    return <div className="graph-container" style={{ color: '#aaa' }}>No game history to display.</div>;
  }

  const width = 500;
  const height = 300;
  const padding = 40;
  const maxScore = 300;

  const getX = (index: number) => {
    // Create n+1 slots for n games to create space on the left
    const slots = games.length + 1;
    const graphWidth = width - padding * 2;
    // Start from the 2nd slot (index 1)
    return padding + ((index + 1) / slots) * graphWidth;
  };

  const getY = (score: number) => {
    return height - padding - (score / maxScore) * (height - padding * 2);
  };

  const points = games.map((game, index) => `${getX(index)},${getY(game.score)}`).join(' ');

  return (
    <div className="graph-container">
      <h3 className="graph-title">Score History</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="scatterplot-svg">
        {/* Y-axis labels and lines */}
        <text x={padding - 10} y={getY(300)} className="axis-label">300</text>
        <line x1={padding} y1={getY(300)} x2={width - padding} y2={getY(300)} className="grid-line" />
        
        <text x={padding - 10} y={getY(150)} className="axis-label">150</text>
        <line x1={padding} y1={getY(150)} x2={width - padding} y2={getY(150)} className="grid-line" />

        <text x={padding - 10} y={getY(0)} className="axis-label">0</text>
        
        {/* Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="axis-line" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="axis-line" />

        {/* Data line */}
        <polyline points={points} className="data-line" />

        {/* Data points */}
        {games.map((game, index) => (
          <g key={index}>
            <circle cx={getX(index)} cy={getY(game.score)} r="5" className="data-point" />
            <text x={getX(index)} y={getY(game.score) - 10} className="point-label">
              {game.score}
            </text>
            <text x={getX(index)} y={height - padding + 20} className="axis-label">
              G{index + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default ScoreScatterPlot;
