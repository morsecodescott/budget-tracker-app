import React from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress,
    Divider,
    IconButton
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const BudgetSection = ({
    title,
    total,
    items,
    transactions,
    type,
    handleCategoryClick,
    handleUnbudgetedClick,
    handleDelete,
    handleEditClick
}) => {
    const sectionSum = Math.round(transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0)
    );

    const aggregatedByCategory =
        title === "Unbudgeted"
            ? transactions.reduce((acc, transaction) => {
                const categoryName = transaction.category.name;
                const parentCategoryName = transaction.category.parentCategoryDetails?.name || "missing";
                if (!acc[categoryName]) {
                    acc[categoryName] = {
                        amount: 0,
                        categoryId: transaction.category._id,
                        parentCategoryName: parentCategoryName
                    };
                }
                acc[categoryName].amount += transaction.amount;
                return acc;
            }, {})
            : null;

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h3" sx={{ float: "left" }}>
                    {title}
                </Typography>
                <Typography variant="body1" sx={{ float: "right" }}>
                    {title !== "Unbudgeted" ? `$${sectionSum} of ` : ""} ${total}
                </Typography>
                <Box sx={{ clear: "both" }} />
                <Divider sx={{ mb: 2 }} />

                {title === "Unbudgeted" && aggregatedByCategory && (
                    Object.entries(aggregatedByCategory).map(([categoryName, data]) => (
                        <Box key={data.categoryId} sx={{ mb: 2 }}>
                            <Typography
                                variant="linkText"
                                sx={{ float: "left" }}
                                onClick={() => handleUnbudgetedClick(data.categoryId)}
                            >
                                {data.parentCategoryName}: {categoryName}
                            </Typography>
                            <Typography variant="body2" sx={{ float: "right" }}>
                                ${data.amount.toFixed(2)}
                            </Typography>
                            <Box sx={{ clear: "both" }} />
                        </Box>
                    ))
                )}

                {title !== "Unbudgeted" &&
                    items.map((item) => {
                        const transactionSum = transactions
                            .filter(
                                (transaction) => transaction.category._id === item.category._id
                            )
                            .reduce((sum, transaction) => sum + transaction.amount, 0);
                        return (
                            <Box key={item._id} sx={{ mb: 2 }}>
                                <Typography
                                    variant="linkText"
                                    sx={{ float: "left" }}
                                    onClick={() => handleCategoryClick(item.category._id)}
                                >
                                    {item.category?.parentCategory?.name || item.category.name}:{" "}
                                    {item.category.name}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ float: "right" }}>
                                    ${item.amount}
                                </Typography>
                                <Box sx={{ clear: "both" }} />
                                <LinearProgress
                                    sx={{ height: 10 }}
                                    variant="determinate"
                                    value={(transactionSum / item.amount) * 100}
                                />
                                <Typography variant="caption">
                                    ${transactionSum} of ${item.amount}
                                </Typography>
                                <IconButton
                                    sx={{ float: "right" }}
                                    onClick={() => handleDelete(item._id)}
                                    size="small"
                                    aria-label="delete"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    sx={{ float: "right" }}
                                    onClick={() => handleEditClick(item)}
                                    size="small"
                                    aria-label="edit"
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        );
                    })}
            </CardContent>
        </Card>
    );
};

export default BudgetSection;
