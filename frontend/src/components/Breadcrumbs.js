import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Breadcrumbs = ({ items }) => {
    const navigate = useNavigate();

    return (
        <MuiBreadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            {items.map((item, index) => {
                if (index === items.length - 1) {
                    return (
                        <Typography key={item.label} color="text.primary">
                            {item.label}
                        </Typography>
                    );
                }
                return (
                    <Link
                        key={item.label}
                        underline="hover"
                        color="inherit"
                        onClick={() => navigate(item.path)}
                        component="button"
                        sx={{ cursor: 'pointer' }}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </MuiBreadcrumbs>
    );
};

export default Breadcrumbs;
