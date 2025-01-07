import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ChartOverTime = ({ transactions }) => {


    const aggregateByMonth = (transactions) => {
        if (!Array.isArray(transactions)) {
            console.warn('Transactions is not an array:', transactions);
            return [];
        }

        const aggregatedData = {};
        transactions.forEach(transaction => {

            const date = new Date(transaction.date);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const key = `${month} ${year}`;
            if (!aggregatedData[key]) {
                aggregatedData[key] = 0;
            }
            aggregatedData[key] += transaction.amount;
        });

        return Object.keys(aggregatedData).map(key => ({
            name: key,
            amount: aggregatedData[key]
        }));
    };

    const data = aggregateByMonth(transactions);

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


export default ChartOverTime;
