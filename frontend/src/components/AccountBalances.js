import React from "react";
import { Card, CardContent, Typography, Box, Divider } from "@mui/material";
import { Link } from "react-router-dom";

const AccountBalances = ({ balances }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h3" gutterBottom>
                    Account Balances
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {balances.length === 0 ? (
                    <Typography>No account balances available</Typography>
                ) : (
                    balances.map((account, index) => (
                        <Box
                            key={index}
                            sx={{
                                marginBottom: 1,
                                textDecoration: 'none',
                                color: 'inherit',
                                '&:hover': {
                                    textDecoration: 'underline'
                                }
                            }}
                            display="flex"
                            justifyContent="space-between"
                            component={Link}
                            to="/linked-accounts"
                        >
                            <Typography variant="body2">
                                {account._id}({account.accountCount}):
                            </Typography>
                            <Typography variant="body2">
                                ${account.totalBalance.toFixed(2)}
                            </Typography>
                        </Box>
                    ))
                )}
            </CardContent>
        </Card>
    );
};

export default AccountBalances;
