/**
 * @fileoverview This file contains the Dashboard component, which is the main view for authenticated users.
 * It displays account balances, budget summaries, budget items, and transactions.
 * It also handles the onboarding process for new users.
 * @module frontend/src/components/Dashboard
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
import OnboardingWizard from "./OnboardingWizard";
import AccountBalances from "./AccountBalances";
import BudgetSummary from "./BudgetSummary";
import PeriodControls from "./PeriodControls";
import Breadcrumbs from "./Breadcrumbs";
import axios from "axios";
import BudgetItemForm from "./BudgetItemForm";
import BudgetSection from "./BudgetSection";

/**
 * The main dashboard component.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The rendered dashboard component.
 */
const Dashboard = ({ children }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [actualIncomeSum, setActualIncomeSum] = useState(0);
  const [actualExpenseSum, setActualExpenseSum] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth();

  /**
   * Checks the user's onboarding status and shows the onboarding wizard if not completed.
   */
  const checkOnboardingStatus = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`/users/${user.id}/onboarding`);
      if (!response.data.onboardingCompleted) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  // Check onboarding status on mount
  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      checkOnboardingStatus();
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  /**
   * Handles the completion of the onboarding process.
   */
  const handleOnboardingComplete = async () => {
    try {
      await axios.patch(`/users/${user.id}/onboarding`, { completed: true });
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };

  /**
   * Handles skipping the onboarding process.
   * @param {string} action - The action to take ('complete' or 'remind').
   */
  const handleOnboardingSkip = (action) => {
    if (action === 'complete') {
      setShowOnboarding(false);
    } else {
      // Handle remind later logic
      setShowOnboarding(false);
    }
  };

  const {
    budgetItems,
    periods,
    categories,
    transactions,
    accountBalances,
    loadingAccountBalances,
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

  /**
   * Navigates to the transactions page with the selected category.
   * @param {string} categoryId - The ID of the category to filter by.
   * @param {boolean} isParentCategory - Whether the category is a parent category.
   */
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

  /**
   * Navigates to the transactions page with the 'unbudgeted' filter.
   */
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

  /**
   * Deletes a budget item.
   * @param {string} id - The ID of the budget item to delete.
   */
  const handleDelete = async (id) => {
    try {
      await axios.delete(`budget/delete/${id}`);
      fetchBudgetItems();
    } catch (error) {
      console.error("Error deleting budget item:", error);
    }
  };

  /**
   * Handles changing the selected period.
   * @param {string} period - The new period to select.
   */
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
    <>
      {showOnboarding && user && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          categories={categories}
          refreshAccountData={fetchAccountBalances}
          userId={user.id}
        />
      )}
      <Container maxWidth="lg">
        <Grid container direction="row" spacing={2} sx={{ justifyContent: "center", alignItems: "flex-start" }}>
          <Grid item xs={12}>
            <Box sx={{ p: 3 }}>
              <Breadcrumbs items={breadcrumbs} />
            </Box>
          </Grid>

          <Grid item xs={12} sm={3}>
            <AccountBalances balances={accountBalances} loading={loadingAccountBalances} />
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
    </>
  );
};

export default Dashboard;
