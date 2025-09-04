import { useState, useEffect } from "react";

export const useBudgetCalculations = (budgetItems, selectedPeriod) => {
    const [incomeSum, setIncomeSum] = useState(0);
    const [expenseSum, setExpenseSum] = useState(0);

    useEffect(() => {
        const filteredItems = budgetItems.filter(
            (item) =>
                new Date(item.period).toISOString().split("T")[0] === selectedPeriod
        );

        const newIncomeSum = filteredItems
            .filter((item) => {
                const parentCategoryName = item.category?.parentCategory?.name || item.category?.name;
                return parentCategoryName === "Income";
            })
            .reduce((acc, curr) => acc + curr.amount, 0);

        const newExpenseSum = filteredItems
            .filter((item) => {
                const parentCategoryName = item.category?.parentCategory?.name || item.category?.name;
                return parentCategoryName !== "Income";
            })
            .reduce((acc, curr) => acc + curr.amount, 0);

        setIncomeSum(Math.round(newIncomeSum));
        setExpenseSum(Math.round(newExpenseSum));
    }, [budgetItems, selectedPeriod]);

    return { incomeSum, expenseSum };
};
