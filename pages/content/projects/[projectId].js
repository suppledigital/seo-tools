// pages/projects/[projectId].js

import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import styles from './[projectId].module.css';
import axios from 'axios';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import { getSession } from 'next-auth/react';

// Import custom components
import EntriesTable from '../../../components/content/EntriesTable';
import InfoModal from '../../../components/content/InfoModal';
import ContentModal from '../../../components/content/ContentModal';
import Sidebar from '../../../components/content/Sidebar';
import AdvancedActions from '../../../components/content/AdvancedActions';


export default function ProjectPage({ initialData }) {
  const router = useRouter();
  const { projectId } = router.query;
  const [project, setProject] = useState(initialData.project);
  const [entries, setEntries] = useState(initialData.entries || []);
  const [hotInstance, setHotInstance] = useState(null);
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
  const [selectedCountry, setSelectedCountry] = useState('AU');
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
  const [sidebarType, setSidebarType] = useState(null);
  const [loadingAnalysisResults, setLoadingAnalysisResults] = useState(false);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [lastSelectedEntryId, setLastSelectedEntryId] = useState(null);

// Add state for the bulk action modal
const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);
const [bulkActionType, setBulkActionType] = useState('');
const [bulkActionField, setBulkActionField] = useState('');
const [bulkActionValue, setBulkActionValue] = useState('');


  const sidebarRef = useRef(null);

  useEffect(() => {
    if (project && !project.initialised) {
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

  /*useEffect(() => {
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
  }, [isSidebarOpen]);*/

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
  const handleShiftClickSelection = (currentEntryId, isChecked) => {
    const currentIndex = entries.findIndex((entry) => entry.entry_id === currentEntryId);
    const lastIndex = entries.findIndex((entry) => entry.entry_id === lastSelectedEntryId);
  
    if (currentIndex > -1 && lastIndex > -1) {
      const [start, end] = currentIndex > lastIndex ? [lastIndex, currentIndex] : [currentIndex, lastIndex];
      const entriesInRange = entries.slice(start, end + 1).map((entry) => entry.entry_id);
  
      let newSelectedEntries;
      if (isChecked) {
        newSelectedEntries = Array.from(new Set([...selectedEntries, ...entriesInRange]));
      } else {
        newSelectedEntries = selectedEntries.filter((id) => !entriesInRange.includes(id));
      }
      setSelectedEntries(newSelectedEntries);
    }
    setLastSelectedEntryId(currentEntryId);
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
    setSidebarType('keyword'); // Set sidebar type

    setLoadingAnalyzeKeyword(true);
    setLoadingSerpResults(true);
    setLoadingSemrushData(true);

    // Fetch data functions
    fetchKeywordAnalysis(keyword, selectedCountry);
    fetchSerpResults(keyword, selectedCountry);
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
      alert(
        `Error fetching SEMRush data: ${
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          'Unknown error'
        }`
      );
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

  // pages/projects/[projectId].js

const fetchSerpResults = async (keyword, country, yearMonth = '') => {
  setLoadingSerpResults(true); // Move this here if not already set in SerpResults
  try {
    const response = await axios.post('/api/content/semrush/organic-results', {
      keyword,
      country,
      yearMonth, // Include yearMonth parameter
    });
    setSidebarContent((prevContent) => ({
      ...prevContent,
      serpResults: response.data,
    }));
  } catch (error) {
    console.error('Error fetching SERP results:', error);
    alert(
      `Error fetching SERP results: ${
        error.response?.data?.message || error.message || 'Unknown error'
      }`
    );
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
      }

      // Replace placeholders in the prompt with actual data
      const prompt = promptTemplate
        .replace('{url}', entry.url)
        .replace('{keywords}', entry.primary_keyword || entry.secondary_keyword || '');
      // Add more replacements as needed

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
    } finally {
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
  const hasValue = (value) => value !== undefined && value !== null;

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
    setClassificationLoading(true); // Start loading
    try {
      // Prepare data
      const urls = entries.map((entry) => entry.url);
  
      // Call the server API route
      const response = await axios.post(
        `/api/content/projects/${projectId}/run-prompt`,
        {
          promptId: 1, // Use the appropriate prompt ID
          urls,
        },
        {
          withCredentials: true,
        }
      );
  
      const responseData = response.data.data;

      // Parse the response and update entries
      const content = responseData.replace(/```json\n?|```/g, '');
      let parsedData;

      try {
        parsedData = JSON.parse(content);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        alert('An error occurred while processing the data.');
        return;
      }

      if (parsedData.pages && Array.isArray(parsedData.pages)) {
        const updatedEntries = entries.map((entry) => {
          const pageData = parsedData.pages.find((page) => page.url === entry.url);
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
    finally{
      setClassificationLoading(false); // Stop loading

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

  // Handler for Bulk Modify
const handleBulkModify = () => {
  if (selectedEntries.length === 0) {
    alert('Please select entries to modify.');
    return;
  }
  setBulkActionType('modify');
  setBulkActionModalVisible(true);
};

// Handler for Bulk Reset
const handleBulkReset = () => {
  if (selectedEntries.length === 0) {
    alert('Please select entries to reset.');
    return;
  }
  setBulkActionType('reset');
  setBulkActionModalVisible(true);
};


// Complete applyBulkAction function
 // Complete applyBulkAction function
 const applyBulkAction = async (actionType, actionField, actionValue) => {
  try {
    const payload = {
      entry_ids: selectedEntries,
      field: actionField,
      value: actionValue,
    };

    // Handle overrideExisting and suggestions for certain additional info types
    if (
      actionField === 'additional_info' &&
      ['lsi_terms', 'paa_terms', 'topic_cluster'].includes(
        Object.keys(actionValue)[0]
      )
    ) {
      const additionalInfoKey = Object.keys(actionValue)[0];
      const additionalInfoData = actionValue[additionalInfoKey];

      payload.overrideExisting = additionalInfoData.overrideExisting;
      payload.suggestions = additionalInfoData.suggestions;
      payload.additionalInfoKey = additionalInfoKey;
    }

    if (actionType === 'modify') {
      await axios.post('/api/content/entries/bulk-modify', payload);
    } else if (actionType === 'reset') {
      await axios.post('/api/content/entries/bulk-reset', payload);
    }

    // Update entries state accordingly
    setEntries((prevEntries) =>
      prevEntries.map((entry) => {
        if (selectedEntries.includes(entry.entry_id)) {
          let updatedEntry = { ...entry };

          if (actionField === 'additional_info') {
            const additionalInfoKey = Object.keys(actionValue)[0];
            const additionalInfoData = actionValue[additionalInfoKey];

            if (
              ['lsi_terms', 'paa_terms', 'topic_cluster'].includes(
                additionalInfoKey
              )
            ) {
              // Ensure additionalInfoData is an object with suggestions array
              if (
                additionalInfoData &&
                Array.isArray(additionalInfoData.suggestions)
              ) {
                const existingItems = additionalInfoData.overrideExisting
                  ? []
                  : entry[additionalInfoKey] || [];
                updatedEntry[additionalInfoKey] = [
                  ...existingItems,
                  ...additionalInfoData.suggestions,
                ];
              } else {
                // Handle cases where suggestions are missing or not an array
                console.error(
                  `Invalid additionalInfoData for ${additionalInfoKey}:`,
                  additionalInfoData
                );
                // You can choose to handle this case differently if needed
              }
            } else {
              // For other additional info types
              updatedEntry[additionalInfoKey] = additionalInfoData;
            }
          } else {
            // For page_type and content_type
            updatedEntry[actionField] = actionValue;
          }
          return updatedEntry;
        }
        return entry;
      })
    );

    alert('Bulk action applied successfully!');
  } catch (error) {
    console.error('Error applying bulk action:', error);
    alert('Error applying bulk action.');
  }
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
        <span className={styles.addBlock} onClick={() => handleAddBlockClick(entry.entry_id)}>
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

  // Collect all handlers to pass to EntriesTable and Sidebar
  const handlers = {
    handleBadgeClick,
    handleBadgeChange,
    renderAdditionalInfoBlocks,
    handleUrlLookup,
    handleKeywordLookup,
    handleSmartAnalysis,
    handleGenerateContent,
    handleDeleteEntry,
    handleCopyContent,
    handleEditContent,
    handleViewContent,
    handleKeywordSearch,
    handleCheckboxChange,
    handleSetAs,
    handleSetAllAs,
    fetchKeywordAnalysis,
    fetchSemrushData,
    fetchSerpResults,
    setLoadingAnalyzeKeyword,
    setLoadingSerpResults,
    setLoadingSemrushData,
    setSidebarType,
    setSidebarContent,
    handleSmartAnalysis,
    setLoadingAnalysisResults,
    handleShiftClickSelection
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
          <AdvancedActions
            entries={entries}
            selectedEntries={selectedEntries}
            setSelectedEntries={setSelectedEntries}
            applyBulkAction={applyBulkAction}
          />
          
          <button className={styles.startButton} onClick={handleStartClassifications}>
            Start Classifications
          </button>
          <EntriesTable
            entries={entries}
            handlers={handlers}
            loadingEntries={loadingEntries}
            classificationLoading={classificationLoading}
            selectedEntries={selectedEntries}
            setSelectedEntries={setSelectedEntries}
            lastSelectedEntryId={lastSelectedEntryId}
            setLastSelectedEntryId={setLastSelectedEntryId}
          />
        </div>
      )}
      {/* Modals */}
      <InfoModal
        isVisible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        title={infoModalTitle}
        value={infoModalValue}
        onChange={setInfoModalValue}
        onSave={handleSaveInfo}
      />
      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={modalContent}
      />
      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          sidebarRef={sidebarRef}
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          keywordInput={keywordInput}
          setKeywordInput={setKeywordInput}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          sidebarType={sidebarType}
          sidebarContent={sidebarContent}
          loadingAnalyzeKeyword={loadingAnalyzeKeyword}
          loadingSemrushData={loadingSemrushData}
          loadingSerpResults={loadingSerpResults}
          selectedRelatedKeywords={selectedRelatedKeywords}
          setSelectedRelatedKeywords={setSelectedRelatedKeywords}
          selectedBroadMatchKeywords={selectedBroadMatchKeywords}
          setSelectedBroadMatchKeywords={setSelectedBroadMatchKeywords}
          selectedPhraseQuestions={selectedPhraseQuestions}
          setSelectedPhraseQuestions={setSelectedPhraseQuestions}
          serpResultsLimit={serpResultsLimit}
          setSerpResultsLimit={setSerpResultsLimit}
          serpResultsExpanded={serpResultsExpanded}
          setSerpResultsExpanded={setSerpResultsExpanded}
          loadingAnalysisResults={loadingAnalysisResults}
          currentEntryId={currentEntryId}
          selectedKeyword={selectedKeyword}
          handlers={handlers}
        />
      )}
      {/* Bulk Action Modal */}
{bulkActionModalVisible && (
  <div className={styles.modal}>
    <div className={styles.modalContent}>
      <span
        className={styles.close}
        onClick={() => setBulkActionModalVisible(false)}
      >
        &times;
      </span>
      <h2>{bulkActionType === 'modify' ? 'Bulk Modify' : 'Bulk Reset'}</h2>
      <div>
        <label>Field:</label>
        <select
          value={bulkActionField}
          onChange={(e) => setBulkActionField(e.target.value)}
        >
          <option value="">Select Field</option>
          <option value="page_type">Page Type</option>
          <option value="content_type">Content Type</option>
          <option value="additional_info">Additional Info</option>
          {/* Add more fields as needed */}
        </select>
      </div>
      {bulkActionType === 'modify' && bulkActionField && bulkActionField !== 'additional_info' && (
        <div>
          <label>New Value:</label>
          <input
            type="text"
            value={bulkActionValue}
            onChange={(e) => setBulkActionValue(e.target.value)}
          />
        </div>
      )}
      {/* For Additional Info, allow selecting which info to update */}
      {bulkActionType === 'modify' && bulkActionField === 'additional_info' && (
        <div>
          <label>Additional Info Type:</label>
          <select
            value={bulkActionValue}
            onChange={(e) => setBulkActionValue(e.target.value)}
          >
            <option value="">Select Info Type</option>
            <option value="word_count">Word Count</option>
            <option value="lsi_terms">LSI Terms</option>
            {/* Add more options as needed */}
          </select>
        </div>
      )}
      <button className={styles.saveButton} onClick={applyBulkAction}>
        Apply
      </button>
    </div>
  </div>
)}

    </div>

    


  );
}

// Fetch data on the server side
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
    const [projectRows] = await pool.query('SELECT * FROM projects WHERE project_id = ?', [
      projectId,
    ]);
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
      const [entryRows] = await pool.query('SELECT * FROM entries WHERE project_id = ?', [
        projectId,
      ]);
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