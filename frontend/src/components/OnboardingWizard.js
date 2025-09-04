import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography, Stepper, Step, StepLabel } from '@mui/material';
import PlaidLinkButton from './PlaidLinkButton';
import BudgetItemForm from './BudgetItemForm';

const steps = ['Link Account', 'Set Up Income', 'Set Up Expenses'];

function OnboardingWizard({ onComplete, onSkip, categories, refreshAccountData, userId }) {
    const [activeStep, setActiveStep] = useState(0);
    const [skipped, setSkipped] = useState(new Set());
    const [formOpen, setFormOpen] = useState(true);

    const handleFormClose = (shouldProgress = true) => {
        setFormOpen(false);
        if (shouldProgress) {
            handleNext();
        }
    };



    const isStepSkipped = (step) => skipped.has(step);

    const handleNext = () => {
        let newSkipped = skipped;
        if (isStepSkipped(activeStep)) {
            newSkipped = new Set(newSkipped);
            newSkipped.delete(activeStep);
        }

        if (activeStep === steps.length - 1) {
            onComplete();
        } else {
            setActiveStep((prevActiveStep) => {
                // Reset formOpen when progressing to a new step
                setFormOpen(true);
                return prevActiveStep + 1;
            });
            setSkipped(newSkipped);
        }
    };

    const handleSkip = () => {
        if (activeStep === steps.length - 1) {
            onSkip('complete');
        } else {
            setSkipped((prevSkipped) => {
                const newSkipped = new Set(prevSkipped);
                newSkipped.add(activeStep);
                return newSkipped;
            });
            onSkip('remind');
        }
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Let's connect your bank account
                        </Typography>
                        <PlaidLinkButton
                            userId={userId}
                            onSuccess={(publicToken, metadata) => {
                                console.log('Successfully linked account:', metadata);
                                // Refresh account balances and progress to next step
                                refreshAccountДata();
                                handleNext();
                            }}
                            onExit={(error, metadata) => {
                                console.log('User exited Plaid link:', error, metadata);
                                // Handle user exiting the flow
                            }}
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Set up your income sources
                        </Typography>
                        <BudgetItemForm
                            open={formOpen}
                            onClose={(shouldProgress) => handleFormClose(shouldProgress)}
                            fetchBudgetItems={() => Promise.resolve(categories)}
                            categories={categories}
                        />
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Set up your expense categories
                        </Typography>
                        <BudgetItemForm
                            open={formOpen}
                            onClose={(shouldProgress) => handleFormClose(shouldProgress)}
                            fetchBudgetItems={() => Promise.resolve(categories)}
                            categories={categories}
                        />
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Stepper activeStep={activeStep}>
                {steps.map((label, index) => {
                    const stepProps = {};
                    const labelProps = {};
                    if (isStepSkipped(index)) {
                        stepProps.completed = false;
                    }
                    return (
                        <Step key={label} {...stepProps}>
                            <StepLabel {...labelProps}>{label}</StepLabel>
                        </Step>
                    );
                })}
            </Stepper>
            <Box sx={{ mt: 2 }}>
                {getStepContent(activeStep)}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={handleSkip}
                    >
                        {activeStep === steps.length - 1 ? 'Skip Setup' : 'Remind Me Later'}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                    >
                        {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

OnboardingWizard.propTypes = {
    onComplete: PropTypes.func.isRequired,
    onSkip: PropTypes.func.isRequired,
    categories: PropTypes.array.isRequired,
    refreshAccountData: PropTypes.func.isRequired
};

export default OnboardingWizard;
