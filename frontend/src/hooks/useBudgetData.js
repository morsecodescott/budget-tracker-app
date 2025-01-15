import { useState, useEffect } from "react";
import axios from "axios";

export const useBudgetData = () => {
    const [budgetItems, setBudgetItems] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [accountBalances, setAccountBalances] = useState([]);

    const fetchBudgetItems = async () => {
        try {
            const { data } = await axios.get("/budget");
            setBudgetItems(data);
            const uniquePeriods = [
                ...new Set(
                    data.map((item) => new Date(item.period).toISOString().split("T")[0])
                ),
            ].sort((a, b) => new Date(a) - new Date(b));
            setPeriods(uniquePeriods);
        } catch (error) {
            console.error("Error fetching budget items:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get("/categories");
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchAccountBalances = async () => {
        try {
            const { data } = await axios.get("/plaid/accounts/summary");
            setAccountBalances(data.summary);
        } catch (error) {
            console.error("Error fetching account balances:", error);
        }
    };

    const fetchTransactions = async (period) => {
        try {
            const startDate = new Date(period).toISOString();
            const endDate = new Date(
                new Date(period).getFullYear(),
                new Date(period).getMonth() + 2,
                0
            ).toISOString();
            const { data } = await axios.get("/plaid/transactions", {
                params: { startDate, endDate },
            });

            data.transactions.forEach((transaction) => {
                if (
                    transaction.category?.name === "Income" ||
                    transaction.category?.parentCategoryDetails?.name === "Income"
                ) {
                    transaction.amount = transaction.amount * -1;
                }
            });

            setTransactions(data.transactions);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    useEffect(() => {
        fetchBudgetItems();
        fetchCategories();
        fetchAccountBalances();
    }, []);

    return {
        budgetItems,
        periods,
        categories,
        transactions,
        accountBalances,
        fetchBudgetItems,
        fetchTransactions,
        fetchCategories,
        fetchAccountBalances
    };
};