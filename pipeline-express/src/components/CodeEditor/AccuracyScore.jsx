import React from 'react';
import { TrendingUp, Award, AlertCircle } from 'lucide-react';
import { calculateAccuracyScore, getRecommendations } from '../../utils/accuracyScoreCalculator';
import './AccuracyScore.css';

const AccuracyScore = ({ annotations = [], totalLines = 100 }) => {
  const scoreData = calculateAccuracyScore(annotations, totalLines);
  const recommendations = getRecommendations(scoreData);

  const ANNOTATION_LABELS = {
    brilliant: '!! Brilliant',
    good: '! Good',
    interesting: '!? Interesting',
    dubious: '?! Dubious',
    mistake: '? Mistake',
    blunder: '?? Blunder',
  };

  const ANNOTATION_COLORS = {
    brilliant: '#00ff88',
    good: '#00ff41',
    interesting: '#00bfff',
    dubious: '#ffd700',
    mistake: '#ff9500',
    blunder: '#ff4444',
  };

  return (
    <div className="accuracy-score">
      <div className="accuracy-score-header">
        <Award size={18} />
        <h3>Code Accuracy</h3>
      </div>

      {/* Main Score Display */}
      <div className="accuracy-score-main">
        <div
          className="accuracy-score-circle"
          style={{
            background: `conic-gradient(${scoreData.color} ${scoreData.score * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`,
          }}
        >
          <div className="accuracy-score-inner">
            <div className="accuracy-score-value">{scoreData.score}%</div>
            <div
              className="accuracy-score-grade"
              style={{ color: scoreData.color }}
            >
              {scoreData.grade}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {scoreData.totalAnnotations > 0 && (
        <div className="accuracy-breakdown">
          <div className="accuracy-breakdown-title">
            <TrendingUp size={14} />
            <span>Breakdown ({scoreData.totalAnnotations} annotations)</span>
          </div>

          <div className="accuracy-breakdown-items">
            {Object.entries(scoreData.breakdown).map(([type, count]) => {
              if (count === 0) return null;

              return (
                <div key={type} className="accuracy-breakdown-item">
                  <span
                    className="accuracy-breakdown-label"
                    style={{ color: ANNOTATION_COLORS[type] }}
                  >
                    {ANNOTATION_LABELS[type]}
                  </span>
                  <span className="accuracy-breakdown-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="accuracy-recommendations">
          <div className="accuracy-recommendations-title">
            <AlertCircle size={14} />
            <span>Insights</span>
          </div>

          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`accuracy-recommendation accuracy-recommendation-${rec.severity}`}
            >
              <span className="accuracy-recommendation-icon">{rec.icon}</span>
              <span className="accuracy-recommendation-text">{rec.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* No Annotations State */}
      {scoreData.totalAnnotations === 0 && (
        <div className="accuracy-empty">
          <p>No annotations yet</p>
          <p className="accuracy-empty-hint">Add annotations to see accuracy score</p>
        </div>
      )}
    </div>
  );
};

export default AccuracyScore;
