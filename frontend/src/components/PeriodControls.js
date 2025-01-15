import React from "react";
import { Box, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';

const PeriodControls = ({
    periods,
    selectedPeriod,
    onPeriodChange,
    onAddBudgetClick
}) => {
    return (
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <Box flexGrow={1} display="flex" justifyContent="left">
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="period-select-label">Select Period</InputLabel>
                    <Select
                        labelId="period-select-label"
                        value={selectedPeriod}
                        onChange={onPeriodChange}
                        label="Budget Period"
                    >
                        {[...periods]
                            .sort((a, b) => new Date(b) - new Date(a))
                            .map((period) => (
                                <MenuItem key={period} value={period}>
                                    {new Date(period + 'T00:00:00Z').toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        timeZone: 'UTC'
                                    })}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>
            </Box>

            <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={onAddBudgetClick}
            >
                Budget Item
            </Button>
        </Box>
    );
};

export default PeriodControls;
