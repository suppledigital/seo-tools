// components/competitor-analysis/CompetitorAnalysis.js
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import styles from './CompetitorAnalysis.module.css';

const CompetitorAnalysis = ({
  overviewData,
  selectedCompetitors,
  renderCompetitivePositioningChart,
}) => {
  const competitivePositioningChartRef = useRef(null);

  useEffect(() => {
    renderCompetitivePositioningChart();
  }, [selectedCompetitors]);

  return (
    <div className={styles.competitorAnalysis}>
      <h3>Competitive Positioning</h3>
      <canvas ref={competitivePositioningChartRef}></canvas>
    </div>
  );
};

export default CompetitorAnalysis;
