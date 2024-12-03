// components/content/ConfigureProjectModal.js

import React, { useState, useEffect } from 'react';
import styles from './ConfigureProjectModal.module.css'; // Ensure you have corresponding CSS
import { toast } from 'react-toastify'; // Import toast for notifications

const ConfigureProjectModal = ({ isVisible, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    phone_number: '',
    physical_location: '',
    services_products: '',
    primary_usp: '',
    secondary_usp: '',
    home_content: '',
    about_us_content: '',
    target_locations: '',
    tone: '',
    grammar: '',
    additional_notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        business_name: initialData.business_name || '',
        phone_number: initialData.phone_number || '',
        physical_location: initialData.physical_location || '',
        services_products: initialData.services_products || '',
        primary_usp: initialData.primary_usp || '',
        secondary_usp: initialData.secondary_usp || '',
        home_content: initialData.home_content || '',
        about_us_content: initialData.about_us_content || '',
        target_locations: initialData.target_locations || '',
        tone: initialData.tone || '',
        grammar: initialData.grammar || '',
        additional_notes: initialData.additional_notes || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    // Add your validation logic here
    if (!formData.business_name.trim()) newErrors.business_name = 'Business Name is required.';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone Number is required.';
    if (!formData.physical_location.trim()) newErrors.physical_location = 'Physical Location is required.';
    if (!formData.services_products.trim()) newErrors.services_products = 'Services/Products is required.';
    if (!formData.primary_usp.trim()) newErrors.primary_usp = 'Primary USP is required.';
    if (!formData.home_content.trim()) newErrors.home_content = 'Home Content is required.';
    if (!formData.about_us_content.trim()) newErrors.about_us_content = 'About Us Content is required.';
    if (!formData.target_locations.trim()) newErrors.target_locations = 'Target Locations is required.';
    if (!formData.tone.trim()) newErrors.tone = 'Tone is required.';
    if (!formData.grammar.trim()) newErrors.grammar = 'Grammar is required.';
    // Add more validations as needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    } else {
      // Optionally, you can show a toast notification for validation errors
      toast.error('Please fix the errors in the form.');
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <span className={styles.closeButton} onClick={onClose}>
          &times;
        </span>
        <h2>Configure Project</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Business Name:</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              required
            />
            {errors.business_name && <span className={styles.error}>{errors.business_name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Phone Number:</label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
            />
            {errors.phone_number && <span className={styles.error}>{errors.phone_number}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Physical Location:</label>
            <input
              type="text"
              name="physical_location"
              value={formData.physical_location}
              onChange={handleChange}
              required
            />
            {errors.physical_location && <span className={styles.error}>{errors.physical_location}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Services/Products:</label>
            <textarea
              name="services_products"
              value={formData.services_products}
              onChange={handleChange}
              required
            />
            {errors.services_products && <span className={styles.error}>{errors.services_products}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Primary USP:</label>
            <textarea
              name="primary_usp"
              value={formData.primary_usp}
              onChange={handleChange}
              required
            />
            {errors.primary_usp && <span className={styles.error}>{errors.primary_usp}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Secondary USP:</label>
            <textarea
              name="secondary_usp"
              value={formData.secondary_usp}
              onChange={handleChange}
            />
            {errors.secondary_usp && <span className={styles.error}>{errors.secondary_usp}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Home Content:</label>
            <textarea
              name="home_content"
              value={formData.home_content}
              onChange={handleChange}
              required
            />
            {errors.home_content && <span className={styles.error}>{errors.home_content}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>About Us Content:</label>
            <textarea
              name="about_us_content"
              value={formData.about_us_content}
              onChange={handleChange}
              required
            />
            {errors.about_us_content && <span className={styles.error}>{errors.about_us_content}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Target Locations:</label>
            <input
              type="text"
              name="target_locations"
              value={formData.target_locations}
              onChange={handleChange}
              required
            />
            {errors.target_locations && <span className={styles.error}>{errors.target_locations}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Tone:</label>
            <input
              type="text"
              name="tone"
              value={formData.tone}
              onChange={handleChange}
              required
            />
            {errors.tone && <span className={styles.error}>{errors.tone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Grammar:</label>
            <input
              type="text"
              name="grammar"
              value={formData.grammar}
              onChange={handleChange}
              required
            />
            {errors.grammar && <span className={styles.error}>{errors.grammar}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Additional Notes:</label>
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
            />
            {errors.additional_notes && <span className={styles.error}>{errors.additional_notes}</span>}
          </div>

          <button type="submit" className={styles.saveButton}>
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfigureProjectModal;
