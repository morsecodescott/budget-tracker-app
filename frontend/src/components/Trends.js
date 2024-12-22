import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Grid,
    Typography,
    Link,
    Breadcrumbs,
    Box,
    CardContent,
    Divider,
    Card,
    ListItem,
    List,
} from "@mui/material";
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';



const Dashboard = () => {
    const navigate = useNavigate();


    // Breadcrumbs array
    const breadcrumbs = [
        <Link key="home" underline="hover" color="inherit" onClick={() => navigate('/')} component="button"
            sx={{ cursor: 'pointer' }}>
            Home
        </Link>,
        <Link key="dashboard" underline="hover" color="inherit" onClick={() => navigate('/dashboard')} component="button"
            sx={{ cursor: 'pointer' }}>
            Dashboard
        </Link>,

        <Typography key="trends" color="text.primary">
            Trends
        </Typography>,
    ];




    return (
        <Container maxWidth="lg"  >
            <Grid container direction="row" spacing={2} sx={{ justifyContent: "center", alignItems: "flex-start", }}>
                <Grid item xs={12} sm={12} >
                    <Box sx={{ p: 2 }}>
                        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                            {breadcrumbs}
                        </Breadcrumbs>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={3} >
                    <Card>
                        <CardContent>
                            <Typography>Chart Types</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1-content"
                                    id="panel1-header"
                                >
                                    Spending
                                </AccordionSummary>
                                <AccordionDetails>
                                    <List>
                                        <ListItem>Over Time</ListItem>
                                        <ListItem>By Category</ListItem>
                                        <ListItem>By Merchant</ListItem>
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={9} >

                    <Card>
                        <CardContent>
                            <Typography>Trends</Typography>
                            <Divider sx={{ mb: 2 }} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>

    );
};

export default Dashboard;