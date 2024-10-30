// components/common/VennChart.js
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './VennChart.module.css';

// Dynamically import Highcharts and VennModule with SSR disabled
const Highcharts = dynamic(() => import('highcharts'), { ssr: false });
const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });
const VennModule = dynamic(() => import('highcharts/modules/venn'), { ssr: false });

const VennChart = ({ options }) => {
  const [chartOptions, setChartOptions] = useState(null);

  useEffect(() => {
    if (Highcharts && VennModule) {
      VennModule(Highcharts);
      setChartOptions(options);
    }
  }, [options, Highcharts, VennModule]);

  if (!chartOptions) return <p>Loading Venn Chart...</p>;

  return (
    <div className={styles.vennContainer}>
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </div>
  );
};

export default VennChart;
