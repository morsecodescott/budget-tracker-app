import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import CsvUpload from './CsvUpload';
import MappingTemplates from './MappingTemplates';

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  }

const UploadDashboard = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Paper sx={{ width: '100%', maxWidth: 800, margin: '20px auto' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="upload tabs">
                    <Tab label="Upload CSV" />
                    <Tab label="Mapping Templates" />
                </Tabs>
            </Box>
            <CustomTabPanel value={tabValue} index={0}>
                <CsvUpload />
            </CustomTabPanel>
            <CustomTabPanel value={tabValue} index={1}>
                <MappingTemplates />
            </CustomTabPanel>
        </Paper>
    );
};

export default UploadDashboard;
