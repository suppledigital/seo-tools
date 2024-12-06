// pages/content/settings/manage-prompts.js
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './manage-prompts.module.css';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';


export default function ManagePrompts() {
  const { data: session, status } = useSession();
  const [prompts, setPrompts] = useState([]);
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [pageTypes, setPageTypes] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [selectedPageType, setSelectedPageType] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingPromptIds, setSavingPromptIds] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const [selectedPrompt, setSelectedPrompt] = useState(null); // For edit modal
  const [showAddModal, setShowAddModal] = useState(false); // For adding new prompt
  // Existing state for newPrompt
  const [newPrompt, setNewPrompt] = useState({
    page_type: '',
    content_type: '',
    prompt_type: 'Global Variable', // Changed to 'Content Prompt' for consistency
    variable_name: '',
    prompt_text: '',
  });

  const router = useRouter();

  const axiosInstance = axios.create({
    withCredentials: true,
  });

  // Define a color palette
  const colorPalette = [
    '#3182ce', // Blue
    '#38a169', // Green
    '#dd6b20', // Orange
    '#d53f8c', // Pink
    '#dd3497', // Magenta
    '#9f7aea', // Purple
    '#dd6b20', // Another Orange
    '#4299e1', // Light Blue
    '#63b3ed', // Sky Blue
    '#4fd1c5', // Teal
  ];

  useEffect(() => {
    console.log('Session:', session); // Debugging line
    if (status === 'loading') return;
    if (!session || session.user.permissions_level !== 'admin') {
      router.push('/'); // Redirect if not admin
    } else {
      fetchPrompts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const fetchPrompts = async () => {
    try {
      // Removed invalid console.log
      const response = await axiosInstance.get('/api/admin/prompts'); // Use axiosInstance for consistency
      console.log('Fetched prompts:', response.data.prompts); // Debugging line
      setPrompts(response.data.prompts);
      setFilteredPrompts(response.data.prompts);
      extractFilters(response.data.prompts);
      assignColors(response.data.prompts);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast.error('Failed to fetch prompts.');
      setIsLoading(false);
    }
  };

  const extractFilters = (prompts) => {
    const pages = [...new Set(prompts.map(prompt => prompt.page_type).filter(Boolean))];
    const contents = [...new Set(prompts.map(prompt => prompt.content_type).filter(Boolean))];
    setPageTypes(pages);
    setContentTypes(contents);
  };

  const assignColors = (prompts) => {
    const uniquePageTypes = [...new Set(prompts.map(prompt => prompt.page_type).filter(Boolean))];
    const uniqueContentTypes = [...new Set(prompts.map(prompt => prompt.content_type).filter(Boolean))];
    const uniqueVariableNames = [...new Set(prompts.map(prompt => prompt.variable_name).filter(Boolean))];

    const newColorMap = {};

    uniquePageTypes.forEach((type, index) => {
      newColorMap[`page_${type}`] = colorPalette[index % colorPalette.length];
    });

    uniqueContentTypes.forEach((type, index) => {
      newColorMap[`content_${type}`] = colorPalette[(uniquePageTypes.length + index) % colorPalette.length];
    });

    uniqueVariableNames.forEach((varName, index) => {
      newColorMap[`variable_name_${varName}`] = colorPalette[(uniquePageTypes.length + uniqueContentTypes.length + index) % colorPalette.length];
    });

    setColorMap(newColorMap);
  };

  const handleFilterChange = () => {
    let filtered = prompts;

    if (selectedPageType) {
      filtered = filtered.filter(prompt => prompt.page_type === selectedPageType);
    }

    if (selectedContentType) {
      filtered = filtered.filter(prompt => prompt.content_type === selectedContentType);
    }

    setFilteredPrompts(filtered);
  };

  useEffect(() => {
    handleFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPageType, selectedContentType, prompts]);

  const handlePromptChange = (promptId, newPromptText) => {
    setFilteredPrompts(prevPrompts =>
      prevPrompts.map(prompt =>
        prompt.id === promptId ? { ...prompt, prompt_text: newPromptText } : prompt
      )
    );
  };

  const handleIndividualSave = async (prompt) => {
    setSavingPromptIds(prev => [...prev, prompt.id]);
    try {
      console.log(`Saving prompt ID ${prompt.id}:`, prompt); // Debugging line
      await axiosInstance.patch('/api/admin/prompts', {
        id: prompt.id,
        prompt_text: prompt.prompt_text.trim(),
        // No need to send prompt_type or other fields
      });
      toast.success(`Prompt ID ${prompt.id} updated successfully.`);
      fetchPrompts(); // Refresh prompts after update
    } catch (error) {
      console.error(`Error updating prompt ID ${prompt.id}:`, error);
      const errorMessage = error.response?.data?.message || `Failed to update Prompt ID ${prompt.id}.`;
      toast.error(errorMessage);
    } finally {
      setSavingPromptIds(prev => prev.filter(id => id !== prompt.id));
    }
  };

  const openModal = (prompt) => {
    setSelectedPrompt(prompt);
  };

  const closeModal = () => {
    setSelectedPrompt(null);
  };

  const handleModalSave = async () => {
    if (!selectedPrompt) return;
    setSavingPromptIds(prev => [...prev, selectedPrompt.id]);
    try {
      console.log(`Saving prompt from modal ID ${selectedPrompt.id}:`, selectedPrompt); // Debugging line
      await axiosInstance.patch('/api/admin/prompts', {
        id: selectedPrompt.id,
        prompt_text: selectedPrompt.prompt_text.trim(),
        // No need to send prompt_type or other fields
      });
      toast.success(`Prompt ID ${selectedPrompt.id} updated successfully.`);
      // Update the main prompts state
      setPrompts(prevPrompts =>
        prevPrompts.map(prompt =>
          prompt.id === selectedPrompt.id
            ? {
                ...prompt,
                prompt_text: selectedPrompt.prompt_text.trim(),
                // No need to update other fields
              }
            : prompt
        )
      );
      closeModal();
    } catch (error) {
      console.error(`Error updating prompt ID ${selectedPrompt.id}:`, error);
      const errorMessage = error.response?.data?.message || `Failed to update Prompt ID ${selectedPrompt.id}.`;
      toast.error(errorMessage);
    } finally {
      setSavingPromptIds(prev => prev.filter(id => id !== selectedPrompt.id));
    }
  };

  // Handlers for Add New Prompt Modal
  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewPrompt({
      page_type: '',
      content_type: '',
      prompt_type: 'Content Prompt', // Ensure consistency
      variable_name: '',
      prompt_text: '',
    });
  };

  // Handler to update newPrompt state
  const handleNewPromptChange = (field, value) => {
    setNewPrompt(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddPrompt = async () => {
    console.log('handleAddPrompt called'); // Debugging line
    const { page_type, content_type, prompt_type, variable_name, prompt_text } = newPrompt;
  
    // Basic client-side validation
    if (!prompt_text.trim()) {
      toast.error('Prompt Text is required.');
      return;
    }
  
    // Prepare payload based on prompt_type
    let payload = {
      prompt_type,
      prompt_text: prompt_text.trim(),
    };
  
    if (prompt_type === 'Content Prompt') {
      if (!page_type.trim() || !content_type.trim()) {
        toast.error('Page Type and Content Type are required for Content Prompts.');
        return;
      }
      payload.page_type = page_type.trim();
      payload.content_type = content_type.trim();
      // No need to include variable_name
    } else if (prompt_type === 'Global Variable') {
      if (!variable_name.trim()) {
        toast.error('Variable Name is required for Global Variables.');
        return;
      }
      // Validate the format of variable_name
      const variableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_\-{}]*$/;
      if (!variableNameRegex.test(variable_name.trim())) {
        toast.error(
          'Variable Name must start with a letter or underscore and can include letters, numbers, underscores (_), dashes (-), and curly brackets ({, }).'
        );
        return;
      }
      payload.variable_name = variable_name.trim();
      // No need to include page_type and content_type
    }

    try {
      console.log('Sending POST request with:', payload); // Debugging line
      await axiosInstance.post('/api/admin/prompts', payload);
      toast.success('New prompt added successfully.');
      fetchPrompts();
      closeAddModal();
    } catch (error) {
      console.error('Error adding new prompt:', error);
      // Extract and display the error message from the server
      const errorMessage = error.response?.data?.message || 'Failed to add new prompt.';
      toast.error(errorMessage);
    }
  };

  // Handle Esc key for modals
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        closeModal();
        closeAddModal();
      }
    };

    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  if (status === 'loading' || isLoading) {
    return <p>Loading...</p>;
  }

  return (
      <div className={styles.container}>
      <h1 className={styles.title}>Manage Prompts</h1>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="pageType">Page Type:</label>
          <select
            id="pageType"
            value={selectedPageType}
            onChange={(e) => setSelectedPageType(e.target.value)}
            className={styles.select}
          >
            <option value="">All</option>
            {pageTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="contentType">Content Type:</label>
          <select
            id="contentType"
            value={selectedContentType}
            onChange={(e) => setSelectedContentType(e.target.value)}
            className={styles.select}
          >
            <option value="">All</option>
            {contentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <button className={styles.addButton} onClick={openAddModal}>
            <i className="fas fa-plus"></i> Add New Prompt
          </button>
        </div>
      </div>

      {filteredPrompts.length === 0 ? (
        <p>No prompts found for the selected combination.</p>
      ) : (
        <div className={styles.gridContainer}>
          {filteredPrompts.map((prompt) => (
            <div key={prompt.id} className={styles.promptCard}>
              <div className={styles.promptHeader}>
                {prompt.variable_name ? (
                  <span
                    className={styles.badge}
                    style={{ backgroundColor: colorMap[`variable_name_${prompt.variable_name}`] || '#a0aec0' }}
                  >
                    {`{${prompt.variable_name}}`}
                  </span>
                ) : (
                  <>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: colorMap[`page_${prompt.page_type}`] || '#a0aec0' }}
                    >
                      {prompt.page_type || 'N/A'}
                    </span>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: colorMap[`content_${prompt.content_type}`] || '#a0aec0' }}
                    >
                      {prompt.content_type || 'N/A'}
                    </span>
                  </>
                )}
                <span className={styles.promptId}>ID: {prompt.id}</span>
              </div>
              <textarea
                value={prompt.prompt_text}
                onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                className={styles.textarea}
                required
              />
              <div className={styles.buttonGroup}>
                <button
                  className={styles.expandButton}
                  onClick={() => openModal(prompt)}
                  title="Expand Prompt"
                  aria-label={`Expand prompt ID ${prompt.id}`}
                >
                  <i className="fas fa-expand"></i>
                </button>
                <button
                  className={styles.saveButton}
                  onClick={() => handleIndividualSave(prompt)}
                  title="Save Prompt"
                  disabled={savingPromptIds.includes(prompt.id)}
                  aria-label={`Save prompt ID ${prompt.id}`}
                >
                  {savingPromptIds.includes(prompt.id) ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-save"></i>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Expanded Prompt */}
      {selectedPrompt && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <span className={styles.modalClose} onClick={closeModal}>
              &times;
            </span>
            <h2 className={styles.modalTitle}>Edit Prompt ID {selectedPrompt.id}</h2>
            <div className={styles.modalBadges}>
              {selectedPrompt.variable_name ? (
                <span
                  className={styles.badge}
                  style={{ backgroundColor: colorMap[`variable_name_${selectedPrompt.variable_name}`] || '#a0aec0' }}
                >
                  {`{${selectedPrompt.variable_name}}`}
                </span>
              ) : (
                <>
                  <span
                    className={styles.badge}
                    style={{ backgroundColor: colorMap[`page_${selectedPrompt.page_type}`] || '#a0aec0' }}
                  >
                    {selectedPrompt.page_type || 'N/A'}
                  </span>
                  <span
                    className={styles.badge}
                    style={{ backgroundColor: colorMap[`content_${selectedPrompt.content_type}`] || '#a0aec0' }}
                  >
                    {selectedPrompt.content_type || 'N/A'}
                  </span>
                </>
              )}
              <span className={styles.promptId}>ID: {selectedPrompt.id}</span>
            </div>
            <div className={styles.modalForm}>
              <div className={styles.modalField}>
                <label htmlFor="promptText">Prompt Text:</label>
                <textarea
                  id="promptText"
                  value={selectedPrompt.prompt_text}
                  onChange={(e) =>
                    setSelectedPrompt({ ...selectedPrompt, prompt_text: e.target.value })
                  }
                  className={styles.modalTextarea}
                  required
                />
              </div>
            </div>
            <button
              className={styles.modalSaveButton}
              onClick={handleModalSave}
              disabled={savingPromptIds.includes(selectedPrompt.id)}
            >
              {savingPromptIds.includes(selectedPrompt.id) ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal for Adding New Prompt */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={closeAddModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <span className={styles.modalClose} onClick={closeAddModal}>
              &times;
            </span>
            <h2 className={styles.modalTitle}>Add New Prompt</h2>
            <div className={styles.modalForm}>
              <div className={styles.modalField}>
                <label htmlFor="newPromptType">Prompt Type:</label>
                <select
                  id="newPromptType"
                  value={newPrompt.prompt_type}
                  onChange={(e) => handleNewPromptChange('prompt_type', e.target.value)}
                  className={styles.select}
                >
                  <option value="Content Prompt">Content Prompt</option>
                  <option value="Global Variable">Global Variable</option>
                </select>
              </div>

              {newPrompt.prompt_type === 'Content Prompt' && (
                <>
                  <div className={styles.modalField}>
                    <label htmlFor="newPageType">Page Type:</label>
                    <input
                      type="text"
                      id="newPageType"
                      value={newPrompt.page_type}
                      onChange={(e) => handleNewPromptChange('page_type', e.target.value)}
                      className={styles.input}
                      placeholder="e.g., Home Page"
                      required
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label htmlFor="newContentType">Content Type:</label>
                    <input
                      type="text"
                      id="newContentType"
                      value={newPrompt.content_type}
                      onChange={(e) => handleNewPromptChange('content_type', e.target.value)}
                      className={styles.input}
                      placeholder="e.g., Banner"
                      required
                    />
                  </div>
                </>
              )}

              {newPrompt.prompt_type === 'Global Variable' && (
                <div className={styles.modalField}>
                  <label htmlFor="newVariableName">Variable Name:</label>
                  <input
                    type="text"
                    id="newVariableName"
                    value={newPrompt.variable_name}
                    onChange={(e) => handleNewPromptChange('variable_name', e.target.value)}
                    className={styles.input}
                    placeholder="e.g., user-name"
                    required
                  />
                  <p className={styles.placeholderInfo}>
                    Format: <strong>{'{variable_name}'}</strong><br/><i>It will be auto formatted to {'{variable_name}'}</i>
                  </p>
                </div>
              )}

              <div className={styles.modalField}>
                <label htmlFor="newPromptText">Prompt Text:</label>
                <textarea
                  id="newPromptText"
                  value={newPrompt.prompt_text}
                  onChange={(e) => handleNewPromptChange('prompt_text', e.target.value)}
                  className={styles.modalTextarea}
                  required
                />
              </div>
              <button
                type="button" // Ensure the button type is 'button'
                className={styles.modalSaveButton}
                onClick={handleAddPrompt}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
