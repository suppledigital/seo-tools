// pages/audit/index.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './index.module.css';
import dynamic from 'next/dynamic';

import DomainOverview from '../../components/audit/domain-overview/DomainOverview';
import SiteAudit from '../../components/audit/site-audit/SiteAudit';
import KeywordResearch from '../../components/audit/keyword-research/KeywordResearch';
import SortableTable from '../../components/common/SortableTable'; // Ensure SortableTable is correctly imported

// Dynamically import HighchartsReact with SSR disabled if needed in other components
const HighchartsReactNoSSR = dynamic(() => import('highcharts-react-official'), { ssr: false });

// Initialize Chart.js
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function AuditHome() {
  const [audits, setAudits] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState(''); // 'url', 'domain', 'keyword'
  const [buttonLabel, setButtonLabel] = useState('Submit');
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [currentTab, setCurrentTab] = useState('Domain Overview'); // 'Domain Overview', 'Site Audit', 'Keyword Research'
  const [auditResults, setAuditResults] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [keywordData, setKeywordData] = useState(null);
  const [serpData, setSerpData] = useState(null);
  const chartInstances = useRef({});
  const chartRefs = useRef({});
  const [sortedOrganicKeywords, setSortedOrganicKeywords] = useState([]);
  const [sortedPaidKeywords, setSortedPaidKeywords] = useState([]);
  const [allCompetitors, setAllCompetitors] = useState([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [selectedCompetitorDomains, setSelectedCompetitorDomains] = useState([]);

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  useEffect(() => {
    // Fetch existing audits on component load
    fetchAuditHistory();
  }, []);

  const fetchAuditHistory = async () => {
    try {
      const response = await axios.post('/api/audit/list', { limit: 10 });
      setAudits(response.data.items);
    } catch (error) {
      console.error('Error fetching audit history:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Detect input type
    if (value.startsWith('http://') || value.startsWith('https://')) {
      setInputType('url');
      setButtonLabel('Show Domain Overview');
      setDropdownOptions(['Show Domain Overview + Start Audit']);
      setSelectedOption('Show Domain Overview');
    } else if (value.includes(' ')) {
      setInputType('keyword');
      setButtonLabel('Start Keyword Research');
      setDropdownOptions([]);
      setSelectedOption('');
    } else if (value) {
      setInputType('domain');
      setButtonLabel('Show Domain Overview');
      setDropdownOptions(['Show Domain Overview', 'Show Domain Overview + Start Audit', 'Show Keyword Overview']);
      setSelectedOption('Show Domain Overview');
    } else {
      setInputType('');
      setButtonLabel('Submit');
      setDropdownOptions([]);
      setSelectedOption('');
    }
  };

  // Scroll Advertising Table (if needed in parent)
  const scrollAdvertisingTable = (direction) => {
    const container = document.querySelector(`.${styles.advertisingTableWrapper}`);
    if (container) {
      const scrollAmount = 200; // Adjust scroll speed as needed
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleSubmit = async () => {
    if (inputType === 'keyword') {
      // Start Keyword Research
      setCurrentTab('Keyword Research');
      await handleKeywordResearch(inputValue);
    } else {
      // Extract domain if input is URL
      let domain = inputValue;
      if (inputType === 'url') {
        try {
          domain = new URL(inputValue).hostname;
        } catch (error) {
          alert('Invalid URL format.');
          return;
        }
      }
      // Remove 'www.' from domain
      domain = domain.replace(/^www\./, '');

      if (selectedOption.includes('Start Audit')) {
        // Start Audit
        await handleStartAudit(domain);
        setCurrentTab('Site Audit');
      } else {
        setCurrentTab('Domain Overview');
      }

      // Fetch Domain Overview
      await fetchDomainOverview(domain);
    }
  };

  const handleStartAudit = async (domain) => {
    setLoadingAudit(true);
    setAuditResults(null);

    try {
      const response = await axios.post('/api/audit/create', { domain });
      const auditId = response.data.id;

      const newAudit = {
        id: auditId,
        title: `${domain}_${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`,
        status: 'pending',
      };
      setAudits([newAudit, ...audits]);

      // Start polling to check audit status
      startPollingForAudit(auditId);
    } catch (error) {
      console.error('Error starting audit:', error);
      setLoadingAudit(false);
    }
  };

  const startPollingForAudit = (auditId) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(`/api/audit/${auditId}`);
        if (statusResponse.data.status === 'finished') {
          clearInterval(interval);
          fetchAuditReport(auditId);
        }
      } catch (error) {
        console.error('Error checking audit status:', error);
      }
    }, 5000); // Poll every 5 seconds
  };

  const fetchAuditReport = async (auditId) => {
    try {
      const reportResponse = await axios.get(`/api/audit/${auditId}/report`);
      setAuditResults(reportResponse.data);
      setLoadingAudit(false);
      setAudits((prevAudits) =>
        prevAudits.map((audit) =>
          audit.id === auditId ? { ...audit, status: 'finished' } : audit
        )
      );
    } catch (error) {
      console.error('Error fetching audit report:', error);
    }
  };

  const fetchDomainOverview = async (domain) => {
    setLoadingOverview(true);
    setOverviewData(null);

    try {
      domain = domain.replace(/^www\./, '');

      const endpoints = [
        { name: 'overview', url: `/api/audit/overview/overview?domain=${encodeURIComponent(domain)}` },
        { name: 'history', url: `/api/audit/overview/history?domain=${encodeURIComponent(domain)}&type=organic` },
        { name: 'organicKeywords', url: `/api/audit/overview/organicKeywords?domain=${encodeURIComponent(domain)}` },
        { name: 'paidKeywords', url: `/api/audit/overview/paidKeywords?domain=${encodeURIComponent(domain)}` },
        { name: 'advertising', url: `/api/audit/overview/advertising?domain=${encodeURIComponent(domain)}` },
        { name: 'competitors', url: `/api/audit/overview/competitors?domain=${encodeURIComponent(domain)}&type=organic` },
      ];

      const data = {};

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint.url);
          data[endpoint.name] = response.data;
        } catch (error) {
          if (error.response?.status === 429) {
            alert('Rate limit exceeded. Please try again later.');
            break;
          } else if (error.response?.status === 404) {
            console.warn(`Data for ${endpoint.name} not found.`);
            data[endpoint.name] = {}; // Assign empty object or default as needed
          } else {
            console.error(`Error fetching ${endpoint.name}:`, error);
            data[endpoint.name] = {}; // Assign empty object to prevent undefined
          }
        }
        await wait(500); // Adjust the delay as needed
      }

      setOverviewData(data);
      setLoadingOverview(false);
    } catch (error) {
      console.error('Error fetching domain overview:', error);
      setLoadingOverview(false);
    }
  };

  const handleKeywordResearch = async (keyword) => {
    setLoadingOverview(true);
    setKeywordData(null);

    try {
      const response = await axios.post('/api/keyword-research', { keyword });
      setKeywordData(response.data);
      setLoadingOverview(false);
    } catch (error) {
      console.error('Error performing keyword research:', error);
      setLoadingOverview(false);
    }
  };

  // Utility function to wait for a specified time
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleAuditClick = (auditId) => {
    setCurrentTab('Site Audit');
    fetchAuditReport(auditId);
  };

  useEffect(() => {
    if (auditResults) {
      // Render charts for Site Audit
      // Assuming SiteAudit component handles its own chart rendering
    }

    return () => {
      Object.values(chartInstances.current).forEach((chart) => {
        if (chart) chart.destroy();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditResults]);

  useEffect(() => {
    if (overviewData) {
      // Sort Organic Keywords
      const sortedOrganic = [...overviewData.organicKeywords].sort((a, b) => b.traffic_percent - a.traffic_percent);
      setSortedOrganicKeywords(sortedOrganic);

      // Sort Paid Keywords
      const sortedPaid = [...overviewData.paidKeywords].sort((a, b) => b.traffic_percent - a.traffic_percent);
      setSortedPaidKeywords(sortedPaid);

      // Fetch and Preselect Competitors
      if (overviewData.competitors && overviewData.competitors.length > 0) {
        setAllCompetitors(overviewData.competitors);

        // Preselect first 4 competitors
        const defaultCompetitors = overviewData.competitors.slice(0, 4);
        setSelectedCompetitors(defaultCompetitors);
        setSelectedCompetitorDomains(defaultCompetitors.map((c) => c.domain));
      }
    }
  }, [overviewData]);

  useEffect(() => {
    if (selectedCompetitors.length > 0) {
      // Competitive Positioning is handled within DomainOverview via canvas ref
    }
  }, [selectedCompetitors]);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h3>Audit History</h3>
        <ul>
          {audits.map((audit) => (
            <li
              key={audit.id}
              className={audit.status === 'finished' ? styles.finished : styles.pending}
              onClick={() => handleAuditClick(audit.id)}
            >
              {audit.title}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.main}>
        <h1>SEO Tool</h1>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Enter your domain or keyword"
            value={inputValue}
            onChange={handleInputChange}
          />
          <button onClick={handleSubmit} disabled={!inputValue}>
            {buttonLabel}
          </button>
          {dropdownOptions.length > 0 && (
            <select value={selectedOption} onChange={handleOptionChange}>
              {dropdownOptions.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>

        {loadingAudit && <div className={styles.loading}>Running Audit...</div>}
        {loadingOverview && <div className={styles.loading}>Fetching Domain Overview...</div>}

        {/* Tabs */}
        {inputType && (
          <div className={styles.tabs}>
            <button
              className={currentTab === 'Domain Overview' ? styles.activeTab : ''}
              onClick={() => setCurrentTab('Domain Overview')}
            >
              Domain Overview
            </button>
            <button
              className={currentTab === 'Site Audit' ? styles.activeTab : ''}
              onClick={() => setCurrentTab('Site Audit')}
            >
              Site Audit
            </button>
            <button
              className={currentTab === 'Keyword Research' ? styles.activeTab : ''}
              onClick={() => setCurrentTab('Keyword Research')}
            >
              Keyword Research
            </button>
            <button
              className={currentTab === 'Competitor Analysis' ? styles.activeTab : ''}
              onClick={() => setCurrentTab('Competitor Analysis')}
            >
              Competitor Analysis
            </button>
          </div>
        )}

        {/* Domain Overview Tab */}
        {currentTab === 'Domain Overview' && overviewData && (
          <DomainOverview
            overviewData={overviewData}
            loadingOverview={loadingOverview}
            sortedOrganicKeywords={sortedOrganicKeywords}
            sortedPaidKeywords={sortedPaidKeywords}
            allCompetitors={allCompetitors}
            selectedCompetitors={selectedCompetitors}
            setSelectedCompetitors={setSelectedCompetitors}
            selectedCompetitorDomains={selectedCompetitorDomains}
            setSelectedCompetitorDomains={setSelectedCompetitorDomains}
          />
        )}

        {/* Site Audit Tab */}
        {currentTab === 'Site Audit' && auditResults && (
          <SiteAudit
            auditResults={auditResults}
            // Assuming SiteAudit handles its own chart rendering
          />
        )}

        {/* Keyword Research Tab */}
        {currentTab === 'Keyword Research' && keywordData && (
          <KeywordResearch keywordData={keywordData} />
        )}
      </div>
    </div>
  );
}
