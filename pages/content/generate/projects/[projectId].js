// pages/projects/[projectId].js

import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';

import { useEffect, useState, useRef } from 'react';
import styles from './[projectId].module.css';
import axios from 'axios';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import { getSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Ensure CSS is imported
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  TextField,
  Typography,
  Card,
  CardContent,
  CardActions,
  Modal,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import DescriptionIcon from '@mui/icons-material/Description'; // This resembles a document
import Backdrop from '@mui/material/Backdrop';
import { Group as GroupIcon, Settings as SettingsIcon, PlayArrow as PlayArrowIcon, Replay as ReplayIcon } from '@mui/icons-material';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull'; 
import ExitFullscreenIcon from '@mui/icons-material/FullscreenExit'; 


// Import custom components
import EntriesTable from '../../../../components/content/EntriesTable';
import InfoModal from '../../../../components/content/InfoModal';
import ContentModal from '../../../../components/content/ContentModal';
import Sidebar from '../../../../components/content/Sidebar';
import AdvancedActions from '../../../../components/content/AdvancedActions';
import ConfigureProjectModal from '../../../../components/content/ConfigureProjectModal';



export default function ProjectPage({ initialData }) {
  const router = useRouter();
  const { data: session, status } = useSession();


// Now you can safely access session.user
const permissionLevel = session?.user?.permissions_level || 'user';

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
  const [modalHumanizedContent, setModalHumanizedContent] = useState('');

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
  const [selectedEntries, setSelectedEntries] = useState([]); // Starts empty
  const [lastSelectedEntryId, setLastSelectedEntryId] = useState(null);

  // Add state for the bulk action modal
  const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [bulkActionField, setBulkActionField] = useState('');
  const [bulkActionValue, setBulkActionValue] = useState('');

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

// Add these state variables
const [isExporting, setIsExporting] = useState(false);
const [exportedDocumentUrl, setExportedDocumentUrl] = useState('');



  const [logsVisible, setLogsVisible] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [selectedLogEntryId, setSelectedLogEntryId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  // For resizing
  const [consoleWidth, setConsoleWidth] = useState(400);
  const [consoleHeight, setConsoleHeight] = useState(200);
  let logsIntervalRef = useRef(null);

  
   
  
  const fetchLogsForEntry = async (entryId) => {
    const response = await axios.get(`/api/content/entries/logs?entry_id=${entryId}`);
    setConsoleLogs(response.data.logs || []);
  };
  
  // Start polling logs when logsVisible is true
  useEffect(() => {
    if (logsVisible && selectedLogEntryId) {
      // Fetch immediately
      fetchLogsForEntry(selectedLogEntryId);
      // Start interval polling every 3 seconds
      logsIntervalRef.current = setInterval(() => {
        fetchLogsForEntry(selectedLogEntryId);
      }, 3000);
    }
  
    return () => {
      // Cleanup: clear interval if logsVisible is turned off
      if (logsIntervalRef.current) {
        clearInterval(logsIntervalRef.current);
        logsIntervalRef.current = null;
      }
    };
  }, [logsVisible, selectedLogEntryId]);
  
  // Resizing logic
  const resizeRef = useRef({ resizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  
  const onMouseDown = (e) => {
    e.preventDefault();
    resizeRef.current = {
      resizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: consoleWidth,
      startHeight: consoleHeight,
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  
  const onMouseMove = (e) => {
    if (!resizeRef.current.resizing) return;
    const deltaX = e.clientX - resizeRef.current.startX;
    const deltaY = e.clientY - resizeRef.current.startY;
    setConsoleWidth(Math.max(200, resizeRef.current.startWidth + deltaX));
    setConsoleHeight(Math.max(100, resizeRef.current.startHeight + deltaY));
  };
  
  const onMouseUp = (e) => {
    resizeRef.current.resizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  
  const sidebarRef = useRef(null);

  const actions = [
    {
      icon: <SettingsIcon />,
      name: 'Configure Project',
      onClick: () => { setIsConfigModalOpen(true); handleClose(); },
      group: 'Setup',
    },
    {
      icon: <GroupIcon />,
      name: 'Auto Classify Page Type',
      onClick: () => { handleStartClassifications(); handleClose(); },
      group: 'Setup',
    },
    {
      icon: <PlayArrowIcon />,
      name: 'Generate All',
      onClick: () => { handleGenerateAllContent(); handleClose(); },
      group: 'Generate',
    },
    {
      icon: <ReplayIcon />,
      name: 'Force Generate All',
      onClick: () => { handleForceGenerateAllContent(); handleClose(); },
      group: 'Generate',
    },
    {
      icon: <DescriptionIcon  />,
      name: 'Export to Google Docs',
      onClick: () => {
        handleExportToGoogleDocs();
        handleClose();
      },
      group: 'Export',
    },
  ];


  const handleExportToGoogleDocs = async () => {
    setIsExporting(true);  // Show the modal with the progress bar
    setExportedDocumentUrl('');  // Clear any previous document URL
  
    try {
      const response = await axios.get(`/api/content/projects/${projectId}/export-to-google-docs`);
  
      if (response.data.documentUrl) {
        // Store the document URL in state
        setExportedDocumentUrl(response.data.documentUrl);
      } else {
        toast.error('Failed to export to Google Docs.');
        setIsExporting(false);  // Hide the modal
      }
    } catch (error) {
      console.error('Error exporting to Google Docs:', error);
  
      if (error.response && error.response.status === 401) {
        // Token might have expired or scopes not granted, prompt re-authentication
        signIn('google', { prompt: 'consent', callbackUrl: window.location.href });
      } else {
        toast.error('Error exporting to Google Docs.');
      }
      setIsExporting(false);  // Hide the modal
    }
  };
  
  
  const handleHumanizeContent = async (entry) => {
    try {
      // Set loading state to true
      setLoadingEntries((prev) => ({
        ...prev,
        [entry.entry_id]: { loading: true, message: '' },
      }));
  
      const response = await axios.post('/api/content/projects/humanise', {
        content: entry.generated_content,
        entry_id: entry.entry_id,
      });
      console.log(response.data);
  
      const { humanizedContent } = response.data;
  
      // Update the entry with humanized content
      setEntries((prevEntries) =>
        prevEntries.map((e) =>
          e.entry_id === entry.entry_id
            ? { ...e, humanized_content: humanizedContent }
            : e
        )
      );
  
      toast.success('Content humanized successfully!');
    } catch (error) {
      console.error('Error humanizing content:', error);
      toast.error('Error humanizing content.');
    } finally {
      // Reset loading state
      setLoadingEntries((prev) => ({
        ...prev,
        [entry.entry_id]: { loading: false, message: '' },
      }));
    }
  };
  
  


  const handleForceGenerateAllContent = async () => {
    const entriesToProcess = entries; // Process all entries, regardless of generated_content
    const totalEntries = entriesToProcess.length;
    const batchSize = 20;
  
    for (let i = 0; i < totalEntries; i += batchSize) {
      const batchEntries = entriesToProcess.slice(i, i + batchSize);
  
      // Initialize retries count
      const retries = {};
      batchEntries.forEach((entry) => {
        retries[entry.entry_id] = 0;
        // Set loading state
        setLoadingEntries((prevState) => ({
          ...prevState,
          [entry.entry_id]: { loading: true, message: '' },
        }));
      });
  
      const promises = batchEntries.map((entry) => generateContentWithRetry(entry, retries, true)); // Pass 'true' to force generation
  
      // Wait for all promises in the batch to complete
      await Promise.all(promises);
    }
  
    toast.success('Force generation process completed.');
  };
  

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
        beforePaste: (data, coords) => {
          let invalidUrlFound = false;
  
          data.forEach((row) => {
            const url = row[0];
            if (
              typeof url === 'string' &&
              url.trim() !== '' &&
              !(url.startsWith('http://') || url.startsWith('https://'))
            ) {
              // Clear the URL cell value
              row[0] = '';
              invalidUrlFound = true;
            }
          });
  
          if (invalidUrlFound) {
            toast.info('Invalid URLs have been cleared.');
          }
        },
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
        toast.success('Data saved successfully!');
        router.reload();
      } catch (error) {
        console.error('Error saving data:', error);
        toast.error('Error saving data.');
      }
    }
  };


  const handleSaveProjectInfo = async (formData) => {
    try {
      const response = await axios.post('/api/content/projects/update-project', {
        project_id: projectId, // Your actual project ID
        form_data: formData, // Updated form data from the modal
      });
  
      if (response.data.status === 'success') {
        toast.success('Project information updated successfully!');
        setIsConfigModalOpen(false);
        // Update the project state with the new data
        setProject((prevProject) => ({
          ...prevProject,
          ...formData,
        }));
      } else {
        toast.error('Failed to update project information.');
      }
    } catch (error) {
      console.error('Error updating project information:', error);
      toast.error('Error updating project information.');
    }
  };
  
  



  const handleKeywordSearch = () => {
    if (!keywordInput.trim()) {
      toast.error('Please enter a keyword.');
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
      toast.error('No keywords selected.');
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

      toast.success(`${infoType} terms saved successfully!`);

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
      toast.error(`Error saving ${infoType} terms.`);
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
        toast.error('Error deleting entry.');
      }
    }
  };

  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard!');
  };

  const handleEditContent = (entryId) => {
    // Implement edit functionality (e.g., open a modal for editing)
    //console.log('Edit content for entry:', entryId);
  };

  const handleViewContent = (entry) => {
    setModalContent(entry.generated_content || 'No generated content available.');
    console.log(entry.generated_content);
    setModalHumanizedContent(entry.humanized_content || 'No humanized content available.');
    console.log(entry.humanized_content);
    setIsModalOpen(true);
  };
  

  const handleUrlLookup = (url) => {
    // Placeholder for future functionality
   // console.log('Lookup URL:', url);
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
      toast.error('Error fetching keyword analysis.');
    } finally {
      setLoadingAnalyzeKeyword(false);
    }
  };

  // pages/projects/[projectId].js

const fetchSerpResults1 = async (keyword, country, yearMonth = '') => {
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
const fetchSerpResults = async (keyword, country, yearMonth = '') => {
  setLoadingSerpResults(true); // Move this here if not already set in SerpResults
  try {
    const response = await axios.post('/api/content/seranking/serp-results', {
      keyword,
      country,
      yearMonth, // Include yearMonth parameter
    });
    console.log(response);
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
      toast.error('Error fetching smart analysis data.');
    } finally {
      setLoadingAnalysisResults(false);
    }
  };


  const handleGenerateAllContent = async () => {
    const entriesToProcess = entries.filter((entry) => !entry.generated_content);
    const totalEntries = entriesToProcess.length;
    const batchSize = 20;

    for (let i = 0; i < totalEntries; i += batchSize) {
      const batchEntries = entriesToProcess.slice(i, i + batchSize);

      // Initialize retries count
      const retries = {};
      batchEntries.forEach((entry) => {
        retries[entry.entry_id] = 0;
        // Set loading state
        setLoadingEntries((prevState) => ({
          ...prevState,
          [entry.entry_id]: { loading: true, message: '' },
        }));
      });

      const promises = batchEntries.map((entry) => generateContentWithRetry(entry, retries));

      // Wait for all promises in the batch to complete
      await Promise.all(promises);
    }

    toast.success('Generation process completed.');
  };

  const generateContentWithRetry = async (entry, retries, force = false) => {
    const maxRetries = 3;
    while (retries[entry.entry_id] < maxRetries) {
      try {
        await handleGenerateContent(entry.entry_id, true, force); // Pass 'force' to handleGenerateContent
        // On success, break out of the loop
        break;
      } catch (error) {
        retries[entry.entry_id] += 1;
        if (retries[entry.entry_id] < maxRetries) {
          // Update loadingEntries with retry message
          setLoadingEntries((prevState) => ({
            ...prevState,
            [entry.entry_id]: {
              loading: true,
              message: `Retrying ${retries[entry.entry_id]} time(s)`,
            },
          }));
        } else {
          // Mark as failed after max retries
          setLoadingEntries((prevState) => ({
            ...prevState,
            [entry.entry_id]: {
              loading: false,
              message: 'Failed after 3 retries',
            },
          }));
        }
      }
    }
    // Set loading to false after processing
    setLoadingEntries((prevState) => ({
      ...prevState,
      [entry.entry_id]: {
        ...prevState[entry.entry_id],
        loading: false,
      },
    }));
  };
  

  // Update handleGenerateContent to accept a second parameter for bulk generation
  const handleGenerateContent = async (entryId, isBulk = false, force = false) => {
    // Set loading state to true for this entry
    setLoadingEntries((prevState) => ({
      ...prevState,
      [entryId]: { loading: true, message: prevState[entryId]?.message || '' },
    }));
  
    const entry = entries.find((e) => e.entry_id === entryId);
  
    // If not forcing, isBulk is true, and content exists, skip generation
    if (!force && isBulk && entry.generated_content) {
      // Reset loading state
      setLoadingEntries((prevState) => ({
        ...prevState,
        [entryId]: { loading: false, message: prevState[entryId]?.message || '' },
      }));
      return;
    }

    // Ensure that both page_type and content_type are set
    if (!entry.page_type || !entry.content_type) {
      if (!isBulk) {
        toast.error('Please select both Page Type and Content Type for this entry.');
      }
      // Reset loading state
      setLoadingEntries((prevState) => ({
        ...prevState,
        [entryId]: { loading: false, message: prevState[entryId]?.message || '' },
      }));
      return;
    }

    // Get compulsory fields based on page_type and content_type
    const compulsoryFields = getCompulsoryFields(entry.page_type, entry.content_type);

    for (const { field, type } of compulsoryFields) {
      const value = entry[field];

      if (type === 'string') {
        if (!value || typeof value !== 'string' || !value.trim()) {
          if (!isBulk) {
            toast.error(`Please provide ${field.replace('_', ' ')} for this entry.`);
          }
          // Reset loading state
          setLoadingEntries((prevState) => ({
            ...prevState,
            [entryId]: { loading: false, message: prevState[entryId]?.message || '' },
          }));
          return;
        }
      } else if (type === 'number') {
        if (value === undefined || value === null || typeof value !== 'number') {
          if (!isBulk) {
            toast.error(`Please provide a valid ${field.replace('_', ' ')} for this entry.`);
          }
          setLoadingEntries((prevState) => ({
            ...prevState,
            [entryId]: { loading: false, message: prevState[entryId]?.message || '' },
          }));
          return;
        }
        if (value <= 0) {
          if (!isBulk) {
            toast.error(`${field.replace('_', ' ')} must be a positive number.`);
          }
          setLoadingEntries((prevState) => ({
            ...prevState,
            [entryId]: { loading: false, message: prevState[entryId]?.message || '' },
          }));
          return;
        }
      }
    }

    try {
      // Send a POST request to the generate-content API with entry_id
      const generateResponse = await axios.post(
        `/api/content/projects/${projectId}/generate-content`,
        {
          entry_id: entryId,
        },
        {
          withCredentials: true,
        }
      );

      const generatedContent = generateResponse.data.data;

      if (!generatedContent) {
        if (!isBulk) {
          toast.error('Received empty content from AI.');
        }
        setLoadingEntries((prevState) => ({
          ...prevState,
          [entryId]: { loading: false, message: prevState[entryId]?.message || '' },
        }));
        return;
      }

      // Update the entry in the client-side state
      setEntries((prevEntries) =>
        prevEntries.map((e) =>
          e.entry_id === entryId ? { ...e, generated_content: generatedContent } : e
        )
      );  

      if (!isBulk) {
        toast.success('Content generated and saved successfully!');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      if (!isBulk) {
        if (error.response && error.response.data && error.response.data.message) {
          toast.error(`Error generating content: ${error.response.data.message}`);
        } else {
          toast.error('Error generating content.');
        }
      }
      throw error; // Re-throw the error to trigger retry logic
    } finally {
      // Reset loading state
      setLoadingEntries((prevState) => ({
        ...prevState,
        [entryId]: { loading: false, message: prevState[entryId]?.message || '' },
      }));
    }
  };
  
  
  const getCompulsoryFields = (pageType, contentType) => {
    const compulsoryFields = [
      { field: 'primary_keyword', type: 'string' },
      { field: 'word_count', type: 'number' },
    ];
  
    // Add more compulsory fields based on pageType and contentType
    if (contentType === 'Rewrite Content' || contentType === 'Additional Content') {
      compulsoryFields.push({ field: 'existing_content', type: 'string' });
    }
    if (pageType === 'Product Page') {
      compulsoryFields.push({ field: 'existing_product_info', type: 'string' });
    }
    if (pageType === 'Category Page') {
      compulsoryFields.push({ field: 'brand_terms', type: 'string' });
    }
    // Add other rules as needed
    return compulsoryFields;
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
      toast.error('Error updating classification.');
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
      toast.error('Error saving information.');
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
        toast.error('An error occurred while processing the data.');
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
        toast.error('An error occurred while processing the data.');
      }
    } catch (error) {
      console.error('Error starting classifications:', error);
      toast.error('Error starting classifications.');
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
    toast.error('Please select entries to modify.');
    return;
  }
  setBulkActionType('modify');
  setBulkActionModalVisible(true);
};

// Handler for Bulk Reset
const handleBulkReset = () => {
  if (selectedEntries.length === 0) {
    toast.error('Please select entries to reset.');
    return;
  }
  setBulkActionType('reset');
  setBulkActionModalVisible(true);
};


const applyBulkAction = async (actionType, actionField, actionValue) => {
  try {
    if (actionType === 'modify' && actionField === 'additional_info') {
      const additionalInfoKey = Object.keys(actionValue)[0];
      const additionalInfoData = actionValue[additionalInfoKey];

      if (additionalInfoData.randomAssignment) {
        // For each selected entry, generate random values and update
        const { values, numberOfValues, overrideExisting } = additionalInfoData;

        if (!values || values.length === 0) {
          toast.error('No values provided for random assignment.');
          return;
        }

        const updatedEntries = [];

        for (const entryId of selectedEntries) {
          // Find the entry
          const entry = entries.find((e) => e.entry_id === entryId);
          if (!entry) continue;

          // Generate random values
          let randomValues = getRandomValues(values, numberOfValues);
          randomValues = randomValues.filter((val) => val && val.trim());

          // Prepare the new value
          let newValue;
          if (overrideExisting) {
            newValue = randomValues;
          } else {
            const existingItems = entry[additionalInfoKey]
              ? entry[additionalInfoKey].split(/[\n,]+/).map((val) => val.trim()).filter((val) => val)
              : [];
            newValue = [...existingItems, ...randomValues];
          }

          // Send request to update entry
          await axios.post('/api/content/entries/save-info', {
            entry_id: entryId,
            info_type: additionalInfoKey,
            info_value: newValue.join(', '),
          });

          // Collect updated entry
          updatedEntries.push({
            ...entry,
            [additionalInfoKey]: newValue.join(', '),
          });
        }

        // Update entries state
        setEntries((prevEntries) =>
          prevEntries.map((e) => {
            const updatedEntry = updatedEntries.find((u) => u.entry_id === e.entry_id);
            return updatedEntry || e;
          })
        );

        toast.success('Bulk action applied successfully!');
        return; // Exit function after processing
      }
    }

    // Existing code for other cases
    const payload = {
      entry_ids: selectedEntries,
      field: actionField,
      value: actionValue,
    };

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

            if (additionalInfoData.suggestions) {
              // For suggestions
              const existingItems = additionalInfoData.overrideExisting
                ? []
                : entry[additionalInfoKey]
                ? entry[additionalInfoKey].split(/[\n,]+/).map((val) => val.trim()).filter((val) => val)
                : [];
              updatedEntry[additionalInfoKey] = [
                ...existingItems,
                ...additionalInfoData.suggestions,
              ].join(', ');
            } else if (typeof additionalInfoData === 'string') {
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

    toast.success('Bulk action applied successfully!');
  } catch (error) {
    console.error('Error applying bulk action:', error);
    toast.error('Error applying bulk action.');
  }
};

const getRandomValues = (valuesArray, numberOfValues) => {
  const result = [];
  if (!valuesArray || valuesArray.length === 0) {
    return result;
  }
  for (let i = 0; i < numberOfValues; i++) {
    const randomIndex = Math.floor(Math.random() * valuesArray.length);
    result.push(valuesArray[randomIndex]);
  }
  return result;
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
    handleShiftClickSelection,
    handleHumanizeContent
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.projects}>
      <Container maxWidth="xlg" sx={{ mt: 1, mb: 1 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h9" component="h3">
          Project: {project.project_name}
          </Typography>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle1" mr={2}>
              Welcome, {session?.user?.name || session?.user?.email}
            </Typography>
            <IconButton onClick={() => router.push('/content/settings')}>
              <SettingsIcon />
            </IconButton>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => signOut()}
              size="small"
              sx={{ ml: 2 }}
            >
              Sign Out
            </Button>
          </Box>
        </Box>
      </Container>
      
    
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
          <AdvancedActions
            entries={entries}
            selectedEntries={selectedEntries}
            setSelectedEntries={setSelectedEntries}
            applyBulkAction={applyBulkAction}
          />
          
         {/*} <div className={styles.actionButtons}>
            <button className={styles.startButton} onClick={handleStartClassifications}>
              Auto Classify Page Type
            </button>
            <button
              className={styles.configureButton}
              onClick={() => setIsConfigModalOpen(true)}
            >
              Configure Project
            </button>
            <button className={styles.generateAllButton} onClick={handleGenerateAllContent}>
              Generate All Content
            </button>
          </div>*}


           {/* Add Project Button */}
        {/*<Fab
         size="medium"
        variant="extended"
          color="primary"
          aria-label="add"
          onClick={() => handleGenerateAllContent}
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          <PlayArrowIcon /> 
          Generate All Content
        </Fab>*/}


      
      <EntriesTable
        entries={entries}
        handlers={handlers}
        loadingEntries={loadingEntries}
        classificationLoading={classificationLoading}
        selectedEntries={selectedEntries}
        setSelectedEntries={setSelectedEntries}
        lastSelectedEntryId={lastSelectedEntryId}
        setLastSelectedEntryId={setLastSelectedEntryId}
        permissionLevel={permissionLevel}
        onShowLogs={(entryId) => {
          setSelectedLogEntryId(entryId);
          fetchLogsForEntry(entryId);
          setLogsVisible(true);
        }}
      />

{logsVisible && (
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: expanded ? '80%' : `${consoleWidth}px`,
          height: expanded ? '60%' : `${consoleHeight}px`,
          background: '#333',
          color: '#fff',
          overflowY: 'auto',
          borderRadius: '5px',
          padding: '10px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div 
          style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '5px'
          }}
        >
          <span>Console Logs (Entry ID: {selectedLogEntryId})</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <IconButton 
              onClick={() => setExpanded(!expanded)}
              style={{ color: '#fff', padding: '4px' }}
            >
              {expanded ? <ExitFullscreenIcon /> : <OpenInFullIcon />}
            </IconButton>
            <IconButton
              onClick={() => setLogsVisible(false)}
              style={{ color: '#fff', padding: '4px' }}
            >
              <CloseIcon />
            </IconButton>
          </div>
        </div>
        <pre style={{whiteSpace: 'pre-wrap', fontSize: '12px', flex: '1 1 auto'}}>
          {consoleLogs.join('\n')}
        </pre>
        {/* Resize handle at bottom-right corner */}
        {!expanded && (
          <div
            style={{
              width: '20px',
              height: '20px',
              background: '#444',
              cursor: 'se-resize',
              alignSelf: 'flex-end'
            }}
            onMouseDown={onMouseDown}
          />
        )}
      </div>
    )}


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
        humanizedContent={modalHumanizedContent}
      />
      
      {/* Configure Project Modal */}
      <ConfigureProjectModal
        isVisible={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        initialData={project} // Pass the current project data as initialData
        onSave={handleSaveProjectInfo}
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
{/* SpeedDial FAB */}
<Backdrop open={open} />
<SpeedDial
  ariaLabel="Actions"
  sx={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}
  icon={<SpaceDashboardIcon />}
  onClose={handleClose}
  onOpen={handleOpen}
  
  open={open}
>
  {actions.map((action, index) => (
    <SpeedDialAction
      key={action.name}
      icon={action.icon}
      tooltipTitle={`${action.group}: ${action.name}`}
      
      onClick={action.onClick}
    />
  ))}
</SpeedDial>
{/* Export Progress Modal */}
<Modal
  open={isExporting}
  onClose={() => setIsExporting(false)}
  aria-labelledby="export-modal-title"
  aria-describedby="export-modal-description"
>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 24,
      p: 4,
      textAlign: 'center',
    }}
  >
    <Typography id="export-modal-title" variant="h6" component="h2" gutterBottom>
      {exportedDocumentUrl ? 'Export Complete' : 'Exporting to Google Docs'}
    </Typography>
    {!exportedDocumentUrl ? (
      <>
        <LinearProgress sx={{ mt: 2, mb: 2 }} />
        <Typography id="export-modal-description" variant="body1">
          Please wait while we export your content.
        </Typography>
      </>
    ) : (
      <>
        <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
          Your content has been successfully exported.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.open(exportedDocumentUrl, '_blank')}
          startIcon={<OpenInNewIcon />}
          sx={{ mb: 2 }}
        >
          Open Document
        </Button>
        <Button variant="outlined" onClick={() => setIsExporting(false)}>
          Close
        </Button>
      </>
    )}
  </Box>
</Modal>



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




  const pool = (await import('../../../../lib/db')).default;

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
    const permissionLevel = session.user.permissions_level || 'user';

    return {
      props: {
        initialData: { project, entries },
        permissionLevel
      },
    };
  } catch (error) {
    console.error('Error fetching project data:', error);
    return {
      notFound: true,
    };
  }
}