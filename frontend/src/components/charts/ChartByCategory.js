import { Divider } from '@mui/material';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const generateColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i * 360) / numColors; // Spread colors evenly around the color wheel
        colors.push(`hsl(${hue}, 70%, 50%)`); // Use HSL to generate colors
    }
    return colors;
};

const ChartByCategory = ({ transactions }) => {
    console.log('transactions:', transactions);

    const aggregateByCategory = (transactions) => {
        const aggregatedData = {};
        transactions.forEach(transaction => {
            const category = transaction.category?.name || 'Uncategorized';
            if (!aggregatedData[category]) {
                aggregatedData[category] = 0;
            }
            aggregatedData[category] += transaction.amount;
        });

        // Separate positive and negative
        const positiveData = Object.keys(aggregatedData)
            .filter(key => aggregatedData[key] > 0)
            .map(key => ({
                name: key,
                amount: aggregatedData[key]
            }));

        const negativeData = Object.keys(aggregatedData)
            .filter(key => aggregatedData[key] < 0)
            .map(key => ({
                name: key,
                amount: aggregatedData[key]
            }));

        return { positiveData, negativeData };
    };

    // Inside the component
    const { positiveData, negativeData } = aggregateByCategory(transactions);
    const COLORS = generateColors(positiveData.length); // Generate colors based on the number of categories

    console.log('positiveData:', positiveData);
    console.log('negativeData:', negativeData);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <PieChart>
                <Pie
                    data={positiveData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                    {positiveData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value, name) => [`$${Math.round(value)}`, name]}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default ChartByCategory;
