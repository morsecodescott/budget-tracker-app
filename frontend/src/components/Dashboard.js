import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBudgetData } from "../hooks/useBudgetData";
import { useBudgetCalculations } from "../hooks/useBudgetCalculations";
import { useBudgetForm } from "../hooks/useBudgetForm";
import { categorizeTransactions } from "../utils/categorizeTransactions";
import {
  Container,
  Grid,
  Box,
} from "@mui/material";
import AccountBalances from "./AccountBalances";
import BudgetSummary from "./BudgetSummary";
import PeriodControls from "./PeriodControls";
import Breadcrumbs from "./Breadcrumbs";
import axios from "axios";
import BudgetItemForm from "./BudgetItemForm";
import BudgetSection from "./BudgetSection";


const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [actualIncomeSum, setActualIncomeSum] = useState(0);
  const [actualExpenseSum, setActualExpenseSum] = useState(0);
  const navigate = useNavigate();

  const {
    budgetItems,
    periods,
    categories,
    transactions,
    accountBalances,
    fetchBudgetItems,
    fetchTransactions,
    fetchCategories,
    fetchAccountBalances
  } = useBudgetData();

  const { incomeSum, expenseSum } = useBudgetCalculations(budgetItems, selectedPeriod);

  const {
    addBudgetOpen,
    itemToEdit,
    handleEditClick,
    handleCloseForm,
    setAddBudgetOpen
  } = useBudgetForm();

  // Breadcrumbs array
  const breadcrumbs = [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "" }
  ];

  const handleCategoryClick = (categoryId, isParentCategory = false) => {
    const startDate = new Date(selectedPeriod).toISOString();
    const endDate = new Date(
      new Date(selectedPeriod).getFullYear(),
      new Date(selectedPeriod).getMonth() + 2,
      0
    ).toISOString();

    navigate("/transactions", {
      state: {
        startDate: startDate,
        endDate: endDate,
        category: categoryId,
      },
    });
  };

  const handleUnbudgetedClick = () => {
    const startDate = new Date(selectedPeriod).toISOString();
    const endDate = new Date(
      new Date(selectedPeriod).getFullYear(),
      new Date(selectedPeriod).getMonth() + 2,
      0
    ).toISOString();

    navigate("/transactions", {
      state: {
        startDate: startDate,
        endDate: endDate,
        budgetFilter: "unbudgeted",
      },
    });
  };

  useEffect(() => {
    fetchBudgetItems();
    fetchCategories();
    fetchAccountBalances();
  }, []);

  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[periods.length - 1]);
    }
  }, [periods]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchTransactions(selectedPeriod);
    }
  }, [selectedPeriod]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`budget/delete/${id}`);
      fetchBudgetItems();
    } catch (error) {
      console.error("Error deleting budget item:", error);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const categorizedTransactions = categorizeTransactions(
    transactions,
    budgetItems,
    selectedPeriod
  );

  useEffect(() => {
    const income = Math.round(
      categorizedTransactions.income.reduce((sum, t) => sum + t.amount, 0)
    );

    const expenses = Math.round(
      categorizedTransactions.expenses.reduce((sum, t) => sum + t.amount, 0)
    );

    const unbudgeted = Math.round(
      categorizedTransactions.unbudgeted.reduce((sum, t) => sum + t.amount, 0)
    );

    const totalExpenses = expenses + unbudgeted;

    setActualIncomeSum(income);
    setActualExpenseSum(totalExpenses);
  }, [categorizedTransactions]);

  return (
    <Container maxWidth="lg">
      <Grid container direction="row" spacing={2} sx={{ justifyContent: "center", alignItems: "flex-start" }}>
        <Grid item xs={12}>
          <Box sx={{ p: 3 }}>
            <Breadcrumbs items={breadcrumbs} />
          </Box>
        </Grid>

        <Grid item xs={12} sm={3}>
          <AccountBalances balances={accountBalances} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <PeriodControls
            periods={periods}
            selectedPeriod={selectedPeriod}
            onPeriodChange={(e) => handlePeriodChange(e.target.value)}
            onAddBudgetClick={() => setAddBudgetOpen(true)}
          />

          <BudgetItemForm
            open={addBudgetOpen}
            onClose={handleCloseForm}
            fetchBudgetItems={fetchBudgetItems}
            categories={categories}
            itemToEdit={itemToEdit}
          />
          <BudgetSection
            title="Income"
            total={incomeSum}
            items={budgetItems.filter((item) => {
              const parentCategoryName = item.category?.parentCategory?.name || item.category?.name;
              return (
                parentCategoryName === "Income" &&
                new Date(item.period).toISOString().split("T")[0] === selectedPeriod
              );
            })}
            transactions={categorizedTransactions.income}
            type="income"
            handleCategoryClick={handleCategoryClick}
            handleDelete={handleDelete}
            handleEditClick={handleEditClick}
          />

          <BudgetSection
            title="Expenses"
            total={expenseSum}
            items={budgetItems.filter((item) => {
              const parentCategoryName = item.category?.parentCategory?.name || item.category?.name;
              return (
                parentCategoryName !== "Income" &&
                new Date(item.period).toISOString().split("T")[0] === selectedPeriod
              );
            })}
            transactions={categorizedTransactions.expenses}
            type="expenses"
            handleCategoryClick={handleCategoryClick}
            handleDelete={handleDelete}
            handleEditClick={handleEditClick}
          />

          <BudgetSection
            title="Unbudgeted"
            total={Math.round(categorizedTransactions.unbudgeted.reduce((sum, t) => sum + t.amount, 0))}
            items={[]}
            transactions={categorizedTransactions.unbudgeted}
            type="unbudgeted"
            handleUnbudgetedClick={handleUnbudgetedClick}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <BudgetSummary
                title="Budgets"
                income={incomeSum}
                expenses={expenseSum}
                remaining={incomeSum - expenseSum}
                isOver={incomeSum - expenseSum < 0}
              />
            </Grid>
            <Grid item>
              <BudgetSummary
                title="Actual"
                income={actualIncomeSum}
                expenses={actualExpenseSum}
                remaining={actualIncomeSum - actualExpenseSum}
                isOver={actualIncomeSum - actualExpenseSum < 0}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
