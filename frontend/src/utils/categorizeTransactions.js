export const categorizeTransactions = (transactions, budgetItems, selectedPeriod) => {
    return transactions.reduce((acc, transaction) => {
        const periodBudgetItems = budgetItems.filter(
            (item) =>
                new Date(item.period).toISOString().split("T")[0] === selectedPeriod
        );

        const budgetCategory = periodBudgetItems.find(
            (item) => item.category._id === transaction.category._id
        );

        if (
            transaction.category?.name === "Income" ||
            transaction.category?.parentCategoryDetails?.name === "Income"
        ) {
            acc.income.push(transaction);
        } else if (budgetCategory) {
            acc.expenses.push(transaction);
        } else {
            acc.unbudgeted.push(transaction);
        }
        return acc;
    }, { income: [], expenses: [], unbudgeted: [] });
};
