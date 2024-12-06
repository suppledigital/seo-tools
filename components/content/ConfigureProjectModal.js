// components/content/ConfigureProjectModal.js

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { toast } from 'react-toastify';

const steps = [
  {
    label: 'Contact Information',
    description: `Provide your business's contact details.`,
    fields: [
      {
        name: 'business_name',
        label: 'Business Name',
        type: 'text',
        required: true,
        tooltip: 'Enter the official name of your business.',
      },
      {
        name: 'phone_number',
        label: 'Phone Number',
        type: 'text',
        required: true,
        tooltip: 'Provide a contact phone number for your business.',
      },
      {
        name: 'physical_location',
        label: 'Physical Location',
        type: 'text',
        required: true,
        tooltip: 'Enter the physical address of your business.',
      },
    ],
  },
  {
    label: 'Project Content',
    description: `Detail the content aspects of your project.`,
    fields: [
      {
        name: 'services_products',
        label: 'Services/Products',
        type: 'textarea',
        required: true,
        tooltip: 'Describe the services or products your business offers.',
      },
      {
        name: 'primary_usp',
        label: 'Primary USP',
        type: 'textarea',
        required: true,
        tooltip: 'State your primary Unique Selling Proposition.',
      },
      {
        name: 'secondary_usp',
        label: 'Secondary USP',
        type: 'textarea',
        required: false,
        tooltip: 'State your secondary Unique Selling Proposition.',
      },
      {
        name: 'reference_content',
        label: 'Reference Content (One Page Sample)',
        type: 'textarea',
        required: true,
        tooltip: 'Provide a one-page sample of your content for reference.',
      },
      {
        name: 'home_content',
        label: 'Home Content',
        type: 'textarea',
        required: true,
        tooltip: 'Enter the content for your home page.',
      },
      {
        name: 'about_us_content',
        label: 'About Us Content',
        type: 'textarea',
        required: true,
        tooltip: 'Enter the content for your About Us page.',
      },
      {
        name: 'target_locations',
        label: 'Target Locations',
        type: 'text',
        required: true,
        tooltip: 'Specify the geographic locations you are targeting.',
      },
    ],
  },
  {
    label: 'Language Settings',
    description: `Select the preferred language for your content.`,
    fields: [
      {
        name: 'language',
        label: 'Language',
        type: 'select',
        required: true,
        options: [
          'British English/Australian English',
          'US English',
        ],
        tooltip: 'Select the preferred language for your content.',
      },
    ],
  },
  {
    label: 'Call to Actions (CTA)',
    description: `Define your primary and secondary call-to-actions.`,
    fields: [
      {
        name: 'primary_cta',
        label: 'Primary CTA',
        type: 'textarea',
        required: false,
        tooltip: 'Enter the primary call-to-action text.',
      },
      {
        name: 'secondary_cta',
        label: 'Secondary CTA',
        type: 'textarea',
        required: false,
        tooltip: 'Enter the secondary call-to-action text.',
      },
    ],
  },
  {
    label: 'Additional Information',
    description: `Provide trust signals and any awards or accreditations.`,
    fields: [
      {
        name: 'trust_signals',
        label: 'Trust Signals',
        type: 'textarea',
        required: false,
        tooltip: 'Provide any trust signals such as testimonials, certifications, or security badges.',
      },
      {
        name: 'awards_accreditations',
        label: 'Awards & Accreditations',
        type: 'textarea',
        required: false,
        tooltip: 'List any awards or accreditations your business has received.',
      },
    ],
  },
  {
    label: 'Additional Notes',
    description: `Enter any extra information or instructions.`,
    fields: [
      {
        name: 'additional_notes',
        label: 'Additional Notes',
        type: 'textarea',
        required: false,
        tooltip: 'Provide any additional notes or instructions.',
      },
    ],
  },
];

const ConfigureProjectModal = ({ isVisible, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    phone_number: '',
    physical_location: '',
    services_products: '',
    primary_usp: '',
    secondary_usp: '',
    reference_content: '',
    home_content: '',
    about_us_content: '',
    target_locations: '',
    language: 'British English/Australian English',
    primary_cta: '',
    secondary_cta: '',
    trust_signals: '',
    awards_accreditations: '',
    additional_notes: '',
  });

  const [errors, setErrors] = useState({});
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData({
        business_name: initialData.business_name || '',
        phone_number: initialData.phone_number || '',
        physical_location: initialData.physical_location || '',
        services_products: initialData.services_products || '',
        primary_usp: initialData.primary_usp || '',
        secondary_usp: initialData.secondary_usp || '',
        reference_content: initialData.reference_content || '',
        home_content: initialData.home_content || '',
        about_us_content: initialData.about_us_content || '',
        target_locations: initialData.target_locations || '',
        language: initialData.language || 'British English/Australian English',
        primary_cta: initialData.primary_cta || '',
        secondary_cta: initialData.secondary_cta || '',
        trust_signals: initialData.trust_signals || '',
        awards_accreditations: initialData.awards_accreditations || '',
        additional_notes: initialData.additional_notes || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateStep = (step) => {
    if (step >= steps.length) return true; // No validation needed if all steps are completed

    const stepFields = steps[step].fields;
    const newErrors = {};

    stepFields.forEach((field) => {
      if (field.required) {
        if (field.type === 'text' || field.type === 'textarea' || field.type === 'select') {
          if (!formData[field.name].trim()) {
            newErrors[field.name] = `${field.label} is required.`;
          }
        }
        // Add more type-based validations if needed
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};

    steps.forEach((step) => {
      step.fields.forEach((field) => {
        if (field.required) {
          if (!formData[field.name].trim()) {
            newErrors[field.name] = `${field.label} is required.`;
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      toast.error('Please fix the errors before proceeding.');
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      business_name: '',
      phone_number: '',
      physical_location: '',
      services_products: '',
      primary_usp: '',
      secondary_usp: '',
      reference_content: '',
      home_content: '',
      about_us_content: '',
      target_locations: '',
      language: 'British English/Australian English',
      primary_cta: '',
      secondary_cta: '',
      trust_signals: '',
      awards_accreditations: '',
      additional_notes: '',
    });
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeStep < steps.length) {
      // If not all steps are completed, attempt to validate and proceed
      if (validateStep(activeStep)) {
        handleNext();
      } else {
        toast.error('Please fix the errors before proceeding.');
      }
    } else {
      // All steps completed, proceed to save the form
      if (validateForm()) { // Optional: Final validation if needed
        onSave(formData);
        onClose(); // Optionally close the modal after saving
        toast.success('Project configuration saved successfully!');
      } else {
        toast.error('Please fix the errors in the form.');
      }
    }
  };

  return (
    <Dialog open={isVisible} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Configure Project</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Typography variant="body2" gutterBottom>
                    {step.description}
                  </Typography>
                  <Grid container spacing={2}>
                    {step.fields.map((field) => (
                      <Grid item xs={12} sm={6} key={field.name}>
                        {field.type === 'text' || field.type === 'textarea' ? (
                          <TextField
                            label={
                              <>
                                {field.label}
                                <Tooltip title={field.tooltip}>
                                  <IconButton size="small" sx={{ ml: 1 }}>
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            }
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            fullWidth
                            required={field.required}
                            multiline={field.type === 'textarea'}
                            rows={field.type === 'textarea' ? 3 : 1}
                            error={!!errors[field.name]}
                            helperText={errors[field.name]}
                          />
                        ) : field.type === 'select' ? (
                          <FormControl fullWidth required={field.required} error={!!errors[field.name]}>
                            <InputLabel id={`${field.name}-label`}>
                              {field.label}
                              <Tooltip title={field.tooltip}>
                                <IconButton size="small" sx={{ ml: 1 }}>
                                  <InfoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </InputLabel>
                            <Select
                              labelId={`${field.name}-label`}
                              label={field.label}
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleChange}
                            >
                              {field.options.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors[field.name] && (
                              <Typography variant="caption" color="error">
                                {errors[field.name]}
                              </Typography>
                            )}
                          </FormControl>
                        ) : null}
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <div>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {index === steps.length - 1 ? 'Finish' : 'Continue'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          {activeStep === steps.length && (
            <Box sx={{ p: 3 }}>
              <Typography>All steps completed - you can now save the configuration.</Typography>
              <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                Reset
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={activeStep !== steps.length}
          >
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

ConfigureProjectModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

export default ConfigureProjectModal;
