// pages/projects/[projectId].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useRef } from 'react';

import styles from './[projectId].module.css';
import axios from 'axios';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import { getSession } from 'next-auth/react';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import SmartAnalysisSidebar from '../../../components/SmartAnalysisSidebar/SmartAnalysisSidebar';


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,      // Added
  BarController,   // Added
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { CircularProgressbar } from 'react-circular-progressbar';

import 'react-circular-progressbar/dist/styles.css';
// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,      // Registered
  BarController,   // Registered
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ProjectPage({ initialData }) {
  const router = useRouter();
  const { projectId } = router.query;
  const [project, setProject] = useState(initialData.project);
  const [entries, setEntries] = useState(initialData.entries || []);
  const [hotInstance, setHotInstance] = useState(null);
  const [showProjectInfoModal, setShowProjectInfoModal] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [currentInfoType, setCurrentInfoType] = useState('');
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalValue, setInfoModalValue] = useState('');
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [additionalInfoOptions, setAdditionalInfoOptions] = useState([]);
  const [showAdditionalInfoDropdown, setShowAdditionalInfoDropdown] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('AU'); // Default to 'AU'
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [loadingAnalyzeKeyword, setLoadingAnalyzeKeyword] = useState(false);
  const [loadingSerpResults, setLoadingSerpResults] = useState(false);
  const [serpResultsLimit, setSerpResultsLimit] = useState(10);
  const [serpResultsExpanded, setSerpResultsExpanded] = useState(false);
  const [loadingSemrushData, setLoadingSemrushData] = useState(false);
  const [selectedRelatedKeywords, setSelectedRelatedKeywords] = useState([]);
  const [selectedBroadMatchKeywords, setSelectedBroadMatchKeywords] = useState([]);
  const [selectedPhraseQuestions, setSelectedPhraseQuestions] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [sidebarType, setSidebarType] = useState(null); // 'keyword' or 'smartAnalysis'
  const [loadingAnalysisResults, setLoadingAnalysisResults] = useState(false);

  

  const sidebarRef = useRef(null);
  const chartInstanceRef = useRef(null);





  useEffect(() => {
    if (project && !project.initialised) {
      // Initialize Handsontable if project is not initialized
      const container = document.getElementById('excelInput');
      const hot = new Handsontable(container, {
        data: [['URL', 'Keywords', 'Meta Title', 'Meta Description']],
        rowHeaders: true,
        colHeaders: ['URL', 'Keywords', 'Title', 'Description'],
        contextMenu: true,
        width: '100%',
        height: 600,
        manualColumnResize: true,
        licenseKey: 'non-commercial-and-evaluation',
      });
      setHotInstance(hot);
    }
  }, [project]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };
  
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    // Trigger a resize of the chart when the sidebar width changes
    if (chartInstanceRef.current) {
      chartInstanceRef.current.resize();
    }
  }, [sidebarExpanded]);

  useEffect(() => {
    setKeywordInput(selectedKeyword);
  }, [selectedKeyword]);
  
  

  const saveData = async () => {
    if (hotInstance) {
      const data = hotInstance.getData();
      try {
        await axios.post(`/api/content/projects/${projectId}/save-data`, {
          data: data,
        });
        alert('Data saved successfully!');
        router.reload();
      } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data.');
      }
    }
  };

  const handleSaveProjectInfo = async (formData) => {
    try {
      await axios.post('/api/content/projects/save-info', {
        project_id: projectId,
        form_data: formData,
      });
      alert('Project information saved!');
      setShowProjectInfoModal(false);
    } catch (error) {
      console.error('Error saving project information:', error);
      alert('Error saving project information.');
    }
  };
  const handleKeywordSearch = () => {
    if (!keywordInput.trim()) {
      alert('Please enter a keyword.');
      return;
    }
  
    setSelectedKeyword(keywordInput.trim());
    setLoadingAnalyzeKeyword(true);
    setLoadingSerpResults(true);
    setLoadingSemrushData(true);
  
    // Reset selected keywords
    setSelectedRelatedKeywords([]);
    setSelectedBroadMatchKeywords([]);
    setSelectedPhraseQuestions([]);
  
    // Fetch data functions
    fetchKeywordAnalysis(keywordInput.trim(), selectedCountry);
    fetchSerpResults(keywordInput.trim(), selectedCountry);
    fetchSemrushData(keywordInput.trim(), selectedCountry);
  };
  
  
  const handleCheckboxChange = (tableType, keyword, isChecked) => {
    let setterFunction;
    let selectedKeywords;
  
    if (tableType === 'related') {
      setterFunction = setSelectedRelatedKeywords;
      selectedKeywords = selectedRelatedKeywords;
    } else if (tableType === 'broad') {
      setterFunction = setSelectedBroadMatchKeywords;
      selectedKeywords = selectedBroadMatchKeywords;
    } else if (tableType === 'phrase') {
      setterFunction = setSelectedPhraseQuestions;
      selectedKeywords = selectedPhraseQuestions;
    }
  
    if (isChecked) {
      setterFunction([...selectedKeywords, keyword]);
    } else {
      setterFunction(selectedKeywords.filter((k) => k !== keyword));
    }
  };
  const handleSetAs = async (tableType, infoType, selectedKeywords) => {
    if (selectedKeywords.length === 0) {
      alert('No keywords selected.');
      return;
    }
  
    try {
      // Build the info value
      const infoValue = selectedKeywords.join(', ');
  
      // Call the API to save the info
      await axios.post('/api/content/entries/save-info', {
        entry_id: currentEntryId,
        info_type: infoType === 'PAA' ? 'paa_terms' : 'lsi_terms',
        info_value: infoValue,
      });
  
      // Update the entries state
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.entry_id === currentEntryId
            ? {
                ...entry,
                [infoType === 'PAA' ? 'paa_terms' : 'lsi_terms']: infoValue,
              }
            : entry
        )
      );
  
      alert(`${infoType} terms saved successfully!`);
  
      // Clear selected keywords
      if (tableType === 'related') {
        setSelectedRelatedKeywords([]);
      } else if (tableType === 'broad') {
        setSelectedBroadMatchKeywords([]);
      } else if (tableType === 'phrase') {
        setSelectedPhraseQuestions([]);
      }
    } catch (error) {
      console.error(`Error saving ${infoType} terms:`, error);
      alert(`Error saving ${infoType} terms.`);
    }
  };
  
  const handleSetAllAs = (tableType, infoType) => {
    let allKeywords;
  
    if (tableType === 'related') {
      allKeywords = sidebarContent.semrushData.relatedKeywords.map((item) => item.keyword);
    } else if (tableType === 'broad') {
      allKeywords = sidebarContent.semrushData.broadMatchKeywords.map((item) => item.keyword);
    } else if (tableType === 'phrase') {
      allKeywords = sidebarContent.semrushData.phraseQuestions.map((item) => item.keyword);
    }
  
    handleSetAs(tableType, infoType, allKeywords);
  };
  
  
  
  const handleDeleteEntry = async (entryId) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`/api/content/entries/${entryId}`, {
          withCredentials: true,
        });
        // Update the entries state
        setEntries((prevEntries) =>
          prevEntries.filter((entry) => entry.entry_id !== entryId)
        );
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Error deleting entry.');
      }
    }
  };
  
  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    alert('Content copied to clipboard!');
  };
  
  
  const handleEditContent = (entryId) => {
    // Implement edit functionality (e.g., open a modal for editing)
    console.log('Edit content for entry:', entryId);
  };
  
  const handleViewContent = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };
  
  
  const handleUrlLookup = (url) => {
    // Placeholder for future functionality
    console.log('Lookup URL:', url);
  };
  
  const handleKeywordLookup = (e, keyword, entryId) => {
    e.stopPropagation();
    setCurrentEntryId(entryId);
    setSelectedKeyword(keyword);
    setIsSidebarOpen(true);
    //setSidebarContent(null); // Reset previous content
    setSidebarType('keyword'); // Set sidebar type

    setLoadingAnalyzeKeyword(true);
    //setLoadingSerpResults(true);
    setLoadingSemrushData(true);
  
    // Fetch data functions
    fetchKeywordAnalysis(keyword, selectedCountry);
    //fetchSerpResults(keyword, selectedCountry);
    fetchSemrushData(keyword, selectedCountry);
  };
  const fetchSemrushData = async (keyword, country) => {
    try {
      const response = await axios.post('/api/content/semrush/keyword-data', {
        keyword,
        country,
      });
      setSidebarContent((prevContent) => ({
        ...prevContent,
        semrushData: response.data,
      }));
    } catch (error) {
      console.error('Error fetching SEMRush data:', error);
      alert('Error fetching SEMRush data.');
    } finally {
      setLoadingSemrushData(false);
    }
  };
  
  const fetchKeywordAnalysis = async (keyword, country) => {
  try {
    const response = await axios.post('/api/content/seranking/analyze-keywords', {
      keyword,
      country,
    });

    const keywordData = response.data && response.data[0] ? response.data[0] : {};

    setSidebarContent((prevContent) => ({
      ...prevContent,
      keywordData,
    }));
  } catch (error) {
    console.error('Error fetching keyword analysis:', error);
    alert('Error fetching keyword analysis.');
  } finally {
    setLoadingAnalyzeKeyword(false);
  }
};

  
  const fetchSerpResults = async (keyword, country) => {
    try {
      const response = await axios.post('/api/content/seranking/serp-results', {
        keyword,
        country,
      });
      setSidebarContent((prevContent) => ({
        ...prevContent,
        serpResults: response.data, // Assuming response is an array
      }));
    } catch (error) {
      console.error('Error fetching SERP results:', error);
      alert('Error fetching SERP results.');
    } finally {
      setLoadingSerpResults(false);
    }
  };
  const handleSmartAnalysis = async (e, keyword, entryId) => {
    e.stopPropagation();
    setCurrentEntryId(entryId);
    setSelectedKeyword(keyword);
    setLoadingAnalysisResults(true);
    setIsSidebarOpen(true);
    setSidebarContent(null); // Clear previous content
    setSidebarType('smartAnalysis'); // Set sidebar type
    setLoadingAnalysisResults(true); // Optional: to show a loading state
  
    try {
      const response = await axios.post('/api/content/frase/process', {
        query: keyword,
        lang: 'en',
        country: 'au',
      });
      setSidebarContent({
        smartAnalysisData: response.data,
      });
    } catch (error) {
      console.error('Error fetching smart analysis data:', error);
      alert('Error fetching smart analysis data.');
    } finally {
      setLoadingAnalysisResults(false);
    }
  };

  
  
  
  const loadPrompt = async (entryId) => {
    const entry = entries.find((e) => e.entry_id === entryId);
  
    if (!entry.page_type || !entry.content_type) {
      alert('Please select both Page Type and Content Type for this entry.');
      return;
    }
  
    try {
      const response = await axios.get('/api/content/prompts', {
        params: {
          page_type: entry.page_type,
          content_type: entry.content_type,
        },
        withCredentials: true,
      });
  
      const promptTemplate = response.data.prompt_text;
  
      // Update the entry with the prompt text
      setEntries((prevEntries) =>
        prevEntries.map((e) =>
          e.entry_id === entryId ? { ...e, prompt_text: promptTemplate } : e
        )
      );
    } catch (error) {
      console.error('Error loading prompt:', error);
      alert('Error loading prompt.');
    }
  };
  
  const handleGenerateContent = async (entryId) => {

    // Set loading state to true
    setLoadingEntries((prevState) => ({
      ...prevState,
      [entryId]: true,
    }));

    const entry = entries.find((e) => e.entry_id === entryId);
  
     // Ensure that both page_type and content_type are set
    if (!entry.page_type || !entry.content_type) {
      alert('Please select both Page Type and Content Type for this entry.');
      // Reset loading state
      setLoadingEntries((prevState) => ({
        ...prevState,
        [entryId]: false,
      }));
      return;
    }
  
    try {
      // Fetch the prompt from the database
      const response = await axios.get('/api/content/prompts', {
        params: {
          page_type: entry.page_type,
          content_type: entry.content_type,
        },
        withCredentials: true,
      });
  
      const promptTemplate = response.data.prompt_text;
  
      if (!promptTemplate) {
        alert('No prompt found for this Page Type and Content Type combination.');
         // Reset loading state
        setLoadingEntries((prevState) => ({
          ...prevState,
          [entryId]: false,
        }));
        return;
          return;
        }
  
      // Replace placeholders in the prompt with actual data
      const prompt = promptTemplate
        .replace('{url}', entry.url)
        .replace('{keywords}', entry.primary_keyword || entry.secondary_keyword || '')
        // Add more replacements as needed
        ;
  
      // Call the API to run the prompt
      const runPromptResponse = await axios.post(
        `/api/content/projects/${projectId}/run-prompt`,
        {
          entry_id: entryId,
          prompt,
        },
        {
          withCredentials: true,
        }
      );
  
      const responseData = runPromptResponse.data.data;
  
      // Update the entry with the generated content
      setEntries((prevEntries) =>
        prevEntries.map((e) =>
          e.entry_id === entryId ? { ...e, generated_content: responseData } : e
        )
      );
  
      // Save the generated content to the database
      await axios.post('/api/content/entries/save-generated-content', {
        entry_id: entryId,
        generated_content: responseData,
      });
  
      alert('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Error generating content.');
    }
    finally {
      // Reset loading state
      setLoadingEntries((prevState) => ({
        ...prevState,
        [entryId]: false,
      }));
    }
  };
  
  

  const handleBadgeClick = (entryId, field, currentValue) => {
    // Set the editing field to show the dropdown
    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.entry_id === entryId ? { ...entry, editingField: field } : entry
      )
    );
  };

  const handleBadgeChange = async (entryId, field, newValue) => {
    try {
      const payload = {
        entry_id: entryId,
        [field]: newValue,
      };

      await axios.post('/api/content/entries/save-classification', payload, {
        withCredentials: true,
      });

      // Update the entries state
      setEntries((prevEntries) =>
        prevEntries.map((entry) => {
          if (entry.entry_id === entryId) {
            const updatedEntry = { ...entry, [field]: newValue, editingField: null };
            return updatedEntry;
          } else {
            return entry;
          }
        })
      );
    } catch (error) {
      console.error('Error updating classification:', error);
      alert('Error updating classification.');
    }
  };

  const handleInfoBlockClick = (entryId, infoKey, currentValue, infoLabel) => {
    setCurrentEntryId(entryId);
    setCurrentInfoType(infoKey);
    setInfoModalTitle(`Provide ${infoLabel}`);
    setInfoModalValue(currentValue || '');
    setInfoModalVisible(true);
  };

  const handleSaveInfo = async () => {
    try {
      const payload = {
        entry_id: currentEntryId,
        info_type: currentInfoType,
        info_value: infoModalValue,
      };
      await axios.post('/api/content/entries/save-info', payload, {
        withCredentials: true,
      });

      // Update the entries state
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.entry_id === currentEntryId
            ? { ...entry, [currentInfoType]: infoModalValue }
            : entry
        )
      );

      setInfoModalVisible(false);
    } catch (error) {
      console.error('Error saving information:', error);
      alert('Error saving information.');
    }
  };

   // Helper function to check if a value is not empty
   const hasValue = (value) => value !== undefined && value !== null; //&& value.trim() !== '';


   const handleAddBlockClick = (entryId) => {
    const entry = entries.find((e) => e.entry_id === entryId);

    const existingInfoKeys = [
      'lsi_terms',
      'paa_terms',
      'topic_cluster',
      'existing_content',
      'existing_product_info',
      'brand_terms',
    ].filter((key) => hasValue(entry[key]));

    const availableOptions = [
      { key: 'lsi_terms', label: 'LSI Terms' },
      { key: 'paa_terms', label: 'PAA Terms' },
      { key: 'topic_cluster', label: 'Topic Cluster' },
      { key: 'existing_content', label: 'Existing Content' },
      { key: 'existing_product_info', label: 'Existing Product Info' },
      { key: 'brand_terms', label: 'Brand Terms' },
    ].filter((option) => !existingInfoKeys.includes(option.key));

    setAdditionalInfoOptions(availableOptions);
    setSelectedEntryId(entryId);
    setShowAdditionalInfoDropdown(true);
  };

  const handleAddInfoSelect = (infoKey) => {
    setShowAdditionalInfoDropdown(false);
    const infoLabel = additionalInfoOptions.find((option) => option.key === infoKey).label;
    handleInfoBlockClick(selectedEntryId, infoKey, '', infoLabel);
  };

  const handleStartClassifications = async () => {
    try {
      // Prepare data
      const urls = entries.map((entry) => entry.url);
  
      // Call the server API route
      const response = await axios.post(
        `/api/projects/${projectId}/run-prompt`,
        {
          promptId: 1, // Use prompt ID 1 as per your instruction
          urls,
        },
        {
          withCredentials: true,
        }
      );
  
      const responseData = response.data.data;
  
      // Parse the response and update entries
      // Assuming the assistantReply is a JSON string with 'pages' array
      const content = responseData.replace(/```json\n?|```/g, '');
      let parsedData;
      console.log(parsedData);

      try {
        parsedData = JSON.parse(content);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        alert('An error occurred while processing the data.');
        return;
      }
      console.log(parsedData);

  
      if (parsedData.pages && Array.isArray(parsedData.pages)) {
        const updatedEntries = entries.map((entry) => {
          const pageData = parsedData.pages.find(
            (page) => page.url === entry.url
          );
          if (pageData) {
            return {
              ...entry,
              page_type: pageData.pageType || entry.page_type,
            };
          }
          return entry;
        });
  
        setEntries(updatedEntries);
  
        // Update the database with new classifications
        for (const entry of updatedEntries) {
          await axios.post(
            '/api/content/entries/save-classification',
            {
              entry_id: entry.entry_id,
              page_type: entry.page_type,
            },
            {
              withCredentials: true,
            }
          );
        }
      } else {
        console.error('Invalid response format:', parsedData);
        alert('An error occurred while processing the data.');
      }
    } catch (error) {
      console.error('Error starting classifications:', error);
      alert('Error starting classifications.');
    }
  };


  const getCompulsoryInfoItems = (entry) => {
    const compulsoryItems = ['word_count'];
    if (
      entry.content_type === 'Rewrite Content' ||
      entry.content_type === 'Additional Content'
    ) {
      compulsoryItems.push('existing_content');
    }
    if (entry.page_type === 'Product Page') {
      compulsoryItems.push('existing_product_info');
    }
    if (entry.page_type === 'Category Page') {
      compulsoryItems.push('brand_terms');
    }
    return compulsoryItems;
  };

  const renderAdditionalInfoBlocks = (entry) => {
    const compulsoryItems = getCompulsoryInfoItems(entry);

    const allInfoItems = [
      { key: 'word_count', label: 'Word Count' },
      { key: 'lsi_terms', label: 'LSI Terms' },
      { key: 'paa_terms', label: 'PAA Terms' },
      { key: 'topic_cluster', label: 'Topic Cluster' },
      { key: 'existing_content', label: 'Existing Content' },
      { key: 'existing_product_info', label: 'Existing Product Info' },
      { key: 'brand_terms', label: 'Brand Terms' },
    ];

    // Only show 'word_count' by default, plus compulsory items and items that have been added (with value)
    const infoItemsToDisplay = allInfoItems.filter(
      (item) =>
        item.key === 'word_count' ||
        compulsoryItems.includes(item.key) ||
        hasValue(entry[item.key])
    );


    return (
      <>
        {infoItemsToDisplay.map((item) => (
          <span
            key={item.key}
            className={`${styles.infoBlock} ${
              hasValue(entry[item.key])
                ? styles.set
                : compulsoryItems.includes(item.key)
                ? styles.required
                : ''
            }`}
            onClick={() =>
              handleInfoBlockClick(entry.entry_id, item.key, entry[item.key], item.label)
            }
            title={entry[item.key] || ''}
          >
            {item.label}
          </span>
        ))}
        {/* Add info block */}
        <span
          className={styles.addBlock}
          onClick={() => handleAddBlockClick(entry.entry_id)}
        >
          +
        </span>
        {showAdditionalInfoDropdown && selectedEntryId === entry.entry_id && (
          <div className={styles.additionalInfoDropdown}>
            {additionalInfoOptions.map((option) => (
              <div
                key={option.key}
                className={styles.dropdownItem}
                onClick={() => handleAddInfoSelect(option.key)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.projects}>
      <h1 className={styles.title}>Project: {project.project_name}</h1>
      {!project.initialised ? (
        <>
          <p>Please paste your data below to initialize the project.</p>
          <div id="excelInput" className={styles.excelInput}></div>
          <button className={styles.saveButton} onClick={saveData}>
            Save Data
          </button>
        </>
      ) : (
        <div className={styles.projectDetails}>
          <h2 className={styles.entriesTitle}>Project Entries</h2>
          <button className={styles.startButton} onClick={handleStartClassifications}>
            Start Classifications
          </button>
          <table className={styles.projectTable}>
            <thead>
              <tr>
                <th>URL</th>
                <th>Keywords</th>
                <th>Additional Info</th>
                <th>Prompt</th> 
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {entries.map((entry) => (
                <tr key={entry.entry_id} data-entry-id={entry.entry_id}>
                  
                  <td className={styles.urlCell}>
                    {entry.url}
                    <i
                      className={`fas fa-search ${styles.lookupIcon}`}
                      onClick={() => handleUrlLookup(entry.url)}
                    ></i>
                    <br />
                    {entry.editingField === 'page_type' ? (
                      <select
                        value={entry.page_type || ''}
                        onChange={(e) =>
                          handleBadgeChange(entry.entry_id, 'page_type', e.target.value)
                        }
                        onBlur={() =>
                          setEntries((prevEntries) =>
                            prevEntries.map((e) =>
                              e.entry_id === entry.entry_id
                                ? { ...e, editingField: null }
                                : e
                            )
                          )
                        }
                      >
                        <option value="">Select Page Type</option>
                        {[
                          'Homepage',
                          'Service Page',
                          'Location Page',
                          'Product Page',
                          'Product Category Page',
                        ].map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`${styles.badge} ${styles.pageTypeBadge} ${
                          entry.page_type ? styles.badgeSet : styles.badgeNotSet
                        }`}
                        onClick={() => handleBadgeClick(entry.entry_id, 'page_type', entry.page_type)}
                      >
                        {entry.page_type || 'Select Page Type'}{' '}
                        <i className="fas fa-caret-down"></i>
                      </span>
                    )}
                    {entry.editingField === 'content_type' ? (
                      <select
                        value={entry.content_type || ''}
                        onChange={(e) =>
                          handleBadgeChange(entry.entry_id, 'content_type', e.target.value)
                        }
                        onBlur={() =>
                          setEntries((prevEntries) =>
                            prevEntries.map((e) =>
                              e.entry_id === entry.entry_id
                                ? { ...e, editingField: null }
                                : e
                            )
                          )
                        }
                      >
                        <option value="">Select Content Type</option>
                        {['New Content', 'Additional Content', 'Rewrite Content'].map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`${styles.badge} ${styles.contentTypeBadge} ${
                          entry.content_type ? styles.badgeSet : styles.badgeNotSet
                        }`}
                        onClick={() =>
                          handleBadgeClick(entry.entry_id, 'content_type', entry.content_type)
                        }
                      >
                        {entry.content_type || 'Select Content Type'}{' '}
                        <i className="fas fa-caret-down"></i>
                      </span>
                    )}
                  </td>
                  <td className={styles.keywordsCell}>
                    Primary: {entry.primary_keyword}
                    <i
                      className={`fas fa-search ${styles.lookupIcon}`}
                      onClick={(e) => handleKeywordLookup(e, entry.primary_keyword, entry.entry_id)}
                      ></i>
                      <i
                        className="fas fa-brain" // Smart analysis icon
                        onClick={(e) => handleSmartAnalysis(e, entry.primary_keyword, entry.entry_id)}
                        style={{ marginLeft: '8px', cursor: 'pointer' }} // Optional styling
                        title="Smart Analysis"
                      ></i>

                    <br />
                    Secondary: {entry.secondary_keyword}
                    <i
                      className={`fas fa-search ${styles.lookupIcon}`}
                      onClick={(e) => handleKeywordLookup(e, entry.primary_keyword, entry.entry_id)}
                      ></i>
                  </td>
                  <td className={styles.additionalInfoCell}>
                    {renderAdditionalInfoBlocks(entry)}
                  </td>
                  <td className={styles.generatedContentCell}>
                    {loadingEntries[entry.entry_id] ? (
                      <i className={`fas fa-spinner fa-spin ${styles.contentSpinner}`}></i>
                    ) : entry.generated_content ? (
                      <>
                        <span className={styles.generatedContent}>
                          {entry.generated_content}
                        </span>
                        <div className={styles.contentActions}>
                          <i
                            className={`fas fa-copy ${styles.contentActionIcon}`}
                            title="Copy to Clipboard"
                            onClick={() => handleCopyContent(entry.generated_content)}
                          ></i>
                          <i
                            className={`fas fa-redo ${styles.contentActionIcon}`}
                            title="Regenerate"
                            onClick={() => handleGenerateContent(entry.entry_id)}
                          ></i>
                          <i
                            className={`fas fa-edit ${styles.contentActionIcon}`}
                            title="Edit"
                            onClick={() => handleEditContent(entry.entry_id)}
                          ></i>
                          <i
                            className={`fas fa-eye ${styles.contentActionIcon}`}
                            title="View"
                            onClick={() => handleViewContent(entry.generated_content)}
                          ></i>
                        </div>
                      </>
                    ) : (
                      'No content generated yet.'
                    )}
                  </td>


                  <td className={styles.actionsCell}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleGenerateContent(entry.entry_id)}
                      disabled={loadingEntries[entry.entry_id]}
                    >
                      {loadingEntries[entry.entry_id] ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Generating...
                        </>
                      ) : entry.generated_content ? (
                        'Regenerate'
                      ) : (
                        'Generate'
                      )}
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteEntry(entry.entry_id)}
                    >
                      Delete
                    </button>
                  </td>



                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {infoModalVisible && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span
              className={styles.close}
              onClick={() => setInfoModalVisible(false)}
            >
              &times;
            </span>
            <h2>{infoModalTitle}</h2>
            <textarea
              value={infoModalValue}
              onChange={(e) => setInfoModalValue(e.target.value)}
            ></textarea>
            <button className={styles.saveButton} onClick={handleSaveInfo}>
              Save
            </button>
          </div>
        </div>
      )}
       {/* New Modal for Viewing Generated Content */}
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span
              className={styles.close}
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </span>
            <h2>Generated Content</h2>
            <div className={styles.modalTextContent}>{modalContent}</div>
          </div>
        </div>
      )}
      {isSidebarOpen && (
        <div
          ref={sidebarRef}
          className={`${styles.sidebar} ${sidebarExpanded ? styles.sidebarExpanded : ''}`}
        >
          <i
            className={`fas ${
              sidebarExpanded ? 'fa-arrow-right' : 'fa-arrow-left'
            } ${styles.sidebarToggleIcon}`}
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          ></i>
          <div className={styles.sidebarHeader}>
            {/* Existing Keyword Input and Controls */}
            <div className={styles.keywordInputContainer}>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleKeywordSearch();
                  }
                }}
                placeholder="Enter keyword"
              />
              <i className="fas fa-paper-plane" onClick={handleKeywordSearch}></i>
            </div>
            <br />
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                // Re-fetch data with the new country
                setLoadingAnalyzeKeyword(true);
                setLoadingSerpResults(true);
                setLoadingSemrushData(true);
                if (sidebarType === 'keyword') {
                  fetchKeywordAnalysis(selectedKeyword, e.target.value);
                  fetchSerpResults(selectedKeyword, e.target.value);
                  fetchSemrushData(selectedKeyword, e.target.value);
                } else if (sidebarType === 'smartAnalysis') {
                  handleSmartAnalysis(null, selectedKeyword, currentEntryId);
                }
              }}
            >
              <option value="AU">Australia</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="NZ">New Zealand</option>
              {/* Add more countries as needed */}
            </select>
          </div>
          <div className={styles.sidebarContent}>
          {sidebarType === 'keyword' && sidebarContent && (
            <>
            {loadingAnalyzeKeyword ? (
              <div>Loading keyword analysis...</div>
            ) : (
              sidebarContent && sidebarContent.keywordData && (
                <div className={styles.keywordAnalysis}>
                  <h3>Keyword Analysis</h3>
                  <div className={styles.analysisGrid}>
                    {/* Row 1: Difficulty Chart, Trend Chart, Volume */}
                    <div className={styles.difficultyBlock}>
                      <div className={styles.blockHeader} style={{ display:'flex' }}><span>Difficulty</span>  <img src="/assets/seranking.svg" alt="SE Ranking Logo" style={{ width: '60px', height: 'auto', marginLeft:'5px'}} /> </div> 

                      <div className={styles.blockContent}>
                        <CircularProgressbar
                          value={sidebarContent.keywordData.difficulty}
                          text={`${sidebarContent.keywordData.difficulty}%`}
                          styles={{
                            path: { stroke: '#0070f3' },
                            text: { fill: '#000' },
                            trail: { stroke: '#d6d6d6' },
                            background: { fill: '#fff' },
                          }}
                        />
                      </div>
                    </div>
                    {sidebarContent.keywordData.history_trend ? (
                      <div className={styles.trendBlock}>
                      <div className={styles.blockHeader} style={{ display:'flex' }}><span>Trend</span>  <img src="/assets/seranking.svg" alt="SE Ranking Logo" style={{ width: '60px', height: 'auto', marginLeft:'5px'}} /> </div> 
                      <div className={styles.blockContent}>
                        <Bar
                          ref={(chart) => {
                            if (chart) {
                              chartInstanceRef.current = chart;
                            }
                          }}
                          data={{
                            labels: Object.keys(sidebarContent.keywordData.history_trend),
                            datasets: [
                              {
                                label: 'Search Volume',
                                data: Object.values(sidebarContent.keywordData.history_trend),
                                backgroundColor: '#0070f3',
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                            scales: {
                              x: {
                                ticks: {
                                  display: false, // Hide x-axis labels if desired
                                },
                                grid: {
                                  display: false,
                                },
                              },
                              y: {
                                ticks: {
                                  display: false, // Hide y-axis labels if desired
                                },
                                grid: {
                                  display: false,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.trendBlock}>
                      <div className={styles.blockHeader} style={{ display:'flex' }}><span>Trend</span>  <img src="/assets/seranking.svg" alt="SE Ranking Logo" style={{ width: '60px', height: 'auto', marginLeft:'5px'}} /> </div> 
                      <div className={styles.blockContent}>
                        <div>No trend data available.</div>
                      </div>
                    </div>
                  )}
                    <div className={styles.volumeBlock}>
                     <div className={styles.blockHeader} style={{ display:'flex' }}><span>Volume</span>  <img src="/assets/seranking.svg" alt="SE Ranking Logo" style={{ width: '60px', height: 'auto', marginLeft:'5px'}} /> </div> 
                      <div className={styles.blockContent}>
                        <span className={styles.volumeValue}>
                          {sidebarContent.keywordData.volume}
                        </span>
                      </div>
                    </div>
                    {/* Row 2: CPC and Competition */}
                    <div className={styles.cpcBlock}>
                      <div className={styles.blockHeader} style={{ display:'flex' }}><span>CPC</span>  <img src="/assets/seranking.svg" alt="SE Ranking Logo" style={{ width: '60px', height: 'auto', marginLeft:'5px'}} /> </div> 
                      <div className={styles.blockContent}>
                        <span className={styles.cpcValue}>
                          ${sidebarContent.keywordData.cpc}
                        </span>
                      </div>
                    </div>
                    <div className={styles.competitionBlock}>
                     <div className={styles.blockHeader} style={{ display:'flex' }}><span>Competition</span>  <img src="/assets/seranking.svg" alt="SE Ranking Logo" style={{ width: '60px', height: 'auto', marginLeft:'5px'}} /> </div> 
                      <div className={styles.blockContent}>
                        <span className={styles.competitionValue}>
                          {sidebarContent.keywordData.competition}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
            {loadingSemrushData ? (
              <div>Loading Keywords data...</div>
            ) : (
            !loadingSemrushData && sidebarContent && sidebarContent.semrushData && (
              <div className={styles.keywordTablesContainer}>
                <div className={styles.keywordTablesGrid}>
                  {/* Related Keywords */}
                  <div className={styles.keywordTable}>
                    <h3 style={{ display: 'flex' }}><span>Related Keywords</span> <img src="/assets/semrush_rect.png" alt="SEMrush Logo" style={{ width: '100px', height: 'auto' }} /></h3> 
                    {sidebarContent.semrushData.relatedKeywords.length === 0 ? (
                      <div>No Data Found</div>
                    ) : (
                      <>
                        
                        <div class={styles.scrollable}>

                          <table>
                            <thead>
                              <tr>
                                <th></th> {/* For checkbox */}
                                <th>Keyword</th>
                                <th>Volume</th>
                                <th>CPC</th>
                                <th>Competition</th>
                                <th>KD%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sidebarContent.semrushData.relatedKeywords.map((item, index) => (
                                <tr key={index}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={selectedRelatedKeywords.includes(item.keyword)}
                                      onChange={(e) => handleCheckboxChange('related', item.keyword, e.target.checked)}
                                    />
                                  </td>
                                  <td>{item.keyword}</td>
                                  <td>{item.volume}</td>
                                  <td>{item.cpc}</td>
                                  <td>{item.competition}</td>
                                  <td>{item.kd}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className={styles.buttonContainer}>
                          <button onClick={() => handleSetAs('related', 'LSI', selectedRelatedKeywords)}>
                            Set Selected as LSI
                          </button>
                          <button onClick={() => handleSetAllAs('related', 'LSI')}>
                            Set All as LSI
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className={styles.keywordTable}>
                  <h3 style={{ display: 'flex' }}><span>Broad Match Keywords</span> <img src="/assets/semrush_rect.png" alt="SEMrush Logo" style={{ width: '100px', height: 'auto' }} /></h3> 
                  {sidebarContent.semrushData.broadMatchKeywords.length === 0 ? (
                      <div>No Data Found</div>
                    ) : (
                      <>
                       <div class={styles.scrollable}>
                          <table>
                            <thead>
                              <tr>
                                <th></th> {/* For checkbox */}
                                <th>Keyword</th>
                                <th>Volume</th>
                                <th>CPC</th>
                                <th>Competition</th>
                                <th>KD%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sidebarContent.semrushData.broadMatchKeywords.map((item, index) => (
                                <tr key={index}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={selectedBroadMatchKeywords.includes(item.keyword)}
                                      onChange={(e) => handleCheckboxChange('broad', item.keyword, e.target.checked)}
                                    />
                                  </td>
                                  <td>{item.keyword}</td>
                                  <td>{item.volume}</td>
                                  <td>{item.cpc}</td>
                                  <td>{item.competition}</td>
                                  <td>{item.kd}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className={styles.buttonContainer}>
                          <button onClick={() => handleSetAs('broad', 'LSI', selectedBroadMatchKeywords)}>
                            Set Selected as LSI
                          </button>
                          <button onClick={() => handleSetAllAs('broad', 'LSI')}>
                            Set All as LSI
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className={styles.keywordTable}>
                  <h3 style={{ display: 'flex' }}><span>Phrase Questions</span> <img src="/assets/semrush_rect.png" alt="SEMrush Logo" style={{ width: '100px', height: 'auto' }} /></h3> 
                   {sidebarContent.semrushData.phraseQuestions.length === 0 ? (
                      <div>No Data Found</div>
                    ) : (
                      <>
                        
                        <div class={styles.scrollable}>
                          <table>
                            <thead>
                              <tr>
                                <th></th> {/* For checkbox */}
                                <th>Keyword</th>
                                <th>Volume</th>
                                <th>CPC</th>
                                <th>Competition</th>
                                <th>KD%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sidebarContent.semrushData.phraseQuestions.map((item, index) => (
                                <tr key={index}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={selectedPhraseQuestions.includes(item.keyword)}
                                      onChange={(e) => handleCheckboxChange('phrase', item.keyword, e.target.checked)}
                                    />
                                  </td>
                                  <td>{item.keyword}</td>
                                  <td>{item.volume}</td>
                                  <td>{item.cpc}</td>
                                  <td>{item.competition}</td>
                                  <td>{item.kd}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className={styles.buttonContainer}>
                          <button onClick={() => handleSetAs('phrase', 'PAA', selectedPhraseQuestions)}>
                            Set Selected as PAA
                          </button>
                          <button onClick={() => handleSetAllAs('phrase', 'PAA')}>
                            Set All as PAA
                          </button>
                        </div>
                      </>
                    )}
                  </div>





            

                
                </div>
              </div>
            )
            )}

      
            {loadingSerpResults ? (
              <div>Loading SERP results...</div>
            ) : (
              !loadingSerpResults && sidebarContent && sidebarContent.serpResults && (
                <div className={styles.serpResultsContainer}>
                  <h3>SERP Results</h3>
                  <div className={`${styles.serpResults} ${serpResultsExpanded ? styles.serpResultsExpanded : ''}`}>
                    <table className={styles.serpTable}>
                      <tbody>
                        {sidebarContent.serpResults.slice(0, serpResultsLimit).map((result, index) => (
                          <tr key={index}>
                            {/* Position Column */}
                            <td className={styles.positionCell}>{result.position}</td>

                            {/* Result Information Column */}
                            <td className={styles.resultInfoCell}>
                              {/* URL Row */}
                              <div className={styles.urlRow}>
                                <a href={result.url} target="_blank" rel="noopener noreferrer">
                                  <i className="fas fa-external-link-alt"></i>
                                </a>
                                {/* Future implementation icon */}
                                <i className="fas fa-search" onClick={() => {/* Implement later */}}></i>
                                <span className={styles.resultUrl}>{result.url}</span>
                              </div>
                              {/* Title Row */}
                              <div className={styles.titleRow}>
                                <strong>{result.title}</strong>
                              </div>
                              {/* Snippet Row */}
                              <div className={styles.snippetRow}>
                                <em>{result.snippet}</em>
                              </div>
                            </td>

                            {/* Stats Column */}
                            <td className={styles.statsCell}>
                              {index < 10 && (
                                <i className="fas fa-sync-alt" onClick={() => {/* Refresh action */}}></i>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sidebarContent.serpResults.length > 10 && !serpResultsExpanded && (
                    <button
                    className={styles.showMoreButton}
                    onClick={() => {
                      setSerpResultsLimit(sidebarContent.serpResults.length);
                      setSerpResultsExpanded(true);
                    }}
                    >
                    Show More
                    </button>
                    )}
                  {sidebarExpanded && (
                    <div className={styles.futureContent}>
                      {/* Future content will go here */}
                    </div>
                  )}
                </div>
              )
            )}
          
          </>
      )}
{loadingAnalysisResults ? (
              <div>Loading SERP Analysis...</div>
            ) : (
              !loadingAnalysisResults && sidebarType === 'smartAnalysis' && sidebarContent && (
            <SmartAnalysisSidebar smartAnalysisData={sidebarContent.smartAnalysisData} />
          )
        )}
        </div>
        </div>
      )}
      


  
    </div>
  );
}


// Fetch data on the server side
// pages/projects/[projectId].js

export async function getServerSideProps(context) {
  const { projectId } = context.params;

  // Retrieve the session on the server side
  const session = await getSession(context);

  // If there's no session, redirect to the login page
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  const pool = (await import('../../../lib/db')).default;


  // Query the database directly
  try {
    const [projectRows] = await pool.query(
      'SELECT * FROM projects WHERE project_id = ?',
      [projectId]
    );
    const project = projectRows[0];

    if (!project) {
      return {
        notFound: true,
      };
    }

    // Convert Date objects to strings
    if (project.created_at instanceof Date) {
      project.created_at = project.created_at.toISOString();
    }
    if (project.updated_at instanceof Date) {
      project.updated_at = project.updated_at.toISOString();
    }

    let entries = [];
    if (project.initialised) {
      const [entryRows] = await pool.query(
        'SELECT * FROM entries WHERE project_id = ?',
        [projectId]
      );
      entries = entryRows.map((entry) => {
        if (entry.created_at instanceof Date) {
          entry.created_at = entry.created_at.toISOString();
        }
        if (entry.updated_at instanceof Date) {
          entry.updated_at = entry.updated_at.toISOString();
        }
        return entry;
      });
    }

    return {
      props: {
        initialData: { project, entries },
      },
    };
  } catch (error) {
    console.error('Error fetching project data:', error);
    return {
      notFound: true,
    };
  }
}
