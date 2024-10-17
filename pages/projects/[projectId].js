import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from './[projectId].module.css';
import axios from 'axios';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import { getSession } from 'next-auth/react';
import ProjectInfoModal from '../../components/ProjectInfoModal';

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

  const saveData = async () => {
    if (hotInstance) {
      const data = hotInstance.getData();
      try {
        await axios.post(`/api/projects/${projectId}/save-data`, {
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
      await axios.post('/api/projects/save-info', {
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

      await axios.post('/api/entries/save-classification', payload, {
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
      await axios.post('/api/entries/save-info', payload, {
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
            '/api/entries/save-classification',
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
                <th>Generate Content</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.entry_id} data-entry-id={entry.entry_id}>
                  <td className={styles.urlCell}>
                    {entry.url}
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
                          'About Us Page',
                          'Contact Us Page',
                          'Blog Post',
                          'Product Page',
                          'Category Page',
                          'FAQ Page',
                          'Testimonial Page',
                          'Gallery Page',
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
                    <br />
                    Secondary: {entry.secondary_keyword}
                  </td>
                  <td className={styles.additionalInfoCell}>
                    {renderAdditionalInfoBlocks(entry)}
                  </td>
                  <td className={styles.generateCell}>Generate</td>
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

  // Fetch project data from your API route, including session cookies
  try {
    console.log('inside project ID DB_HOST:', process.env.DB_HOST);
    console.log('inside project ID DB_USER:', process.env.DB_USER);
    console.log('cookie', context.req.headers.cookie);
    console.log('fetch url', `${process.env.BASE_URL}/api/projects/${projectId}`);
    const res = await fetch(`${process.env.BASE_URL}/api/projects/${projectId}`, {
      headers: {
        // Pass along the cookie from the request to include the session
        Cookie: context.req.headers.cookie || '',
      },
    });

    // Check if the response is OK
    if (!res.ok) {
      return {
        notFound: true,
      };
    }

    const projectData = await res.json();
   // console.log(projectData);

    return {
      props: {
        initialData: projectData,
      },
    };
  } catch (error) {
    console.error('Error fetching project data:', error);
    return {
      notFound: true,
    };
  }
}
