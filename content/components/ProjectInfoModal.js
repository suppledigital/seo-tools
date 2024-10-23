import React, { useState } from 'react';

const ProjectInfoModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Project Information</h2>
        <form onSubmit={handleSubmit}>
          {/* Business Details */}
          <h3>Business Details</h3>
          <label>
            Business Name:
            <input type="text" name="business_name" onChange={handleChange} />
          </label>
          {/* Add other form fields here */}
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  );
};

export default ProjectInfoModal;
