import { useState } from "react";

export const useBudgetForm = () => {
    const [addBudgetOpen, setAddBudgetOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const handleEditClick = (item) => {
        setItemToEdit(item);
        setAddBudgetOpen(true);
    };

    const handleCloseForm = () => {
        setItemToEdit(null);
        setAddBudgetOpen(false);
    };

    return {
        addBudgetOpen,
        itemToEdit,
        handleEditClick,
        handleCloseForm,
        setAddBudgetOpen
    };
};
