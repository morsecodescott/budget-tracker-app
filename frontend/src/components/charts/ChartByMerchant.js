import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ChartByMerchant = ({ transactions }) => {
    const aggregateByMerchant = (transactions) => {
        if (!Array.isArray(transactions)) {
            console.warn('Transactions is not an array:', transactions);
            return [];
        }

        const aggregatedData = {};
        transactions.forEach(transaction => {
            const merchantName = transaction.name;
            if (!aggregatedData[merchantName]) {
                aggregatedData[merchantName] = 0;
            }
            aggregatedData[merchantName] += transaction.amount;
        });

        return Object.keys(aggregatedData).map(key => ({
            name: key,
            amount: aggregatedData[key]
        }));
    };

    const data = aggregateByMerchant(transactions);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#2E7D32" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default ChartByMerchant;
