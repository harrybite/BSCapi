const axios = require('axios');
const { ethers } = require('ethers');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const { Table } = require('console-table-printer');
const express = require("express");
const cors = require("cors");
const csvParser = require('csv-parser'); // For parsing CSV files

// BscScan API Key & Contract Address
const API_KEY = 'AQDKUQB7MDU534XD19C8IT7NSNAJCTNY7J';
const CONTRACT_ADDRESS = '0x6b3b95B0c84f35c9c505fff8C2F35Ee2e502a44D';
const BSC_API_URL = 'https://api.bscscan.com/api';
const CONTRACT_ABI_PATH = './rusd.json';  // Path to contract ABI

const PORT = 8001;
const app = express();
app.use(cors());
app.use(express.json());

// Load ABI
const CONTRACT_ABI = JSON.parse(fs.readFileSync(CONTRACT_ABI_PATH, 'utf-8'));
const iface = new ethers.Interface(CONTRACT_ABI);

// Fetch Contract Transactions
async function fetchTransactions(contractAddress) {
    try {
        const response = await axios.get(BSC_API_URL, {
            params: {
                module: 'account',
                action: 'txlist',
                address: contractAddress,
                startblock: 45319135,
                endblock: 9999999999,
                sort: 'desc',
                apikey: API_KEY
            }
        });

        const data = response.data;
        if (data.status === '1') {
            return data.result;
        } else {
            console.error('Error:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching transactions:', error.message);
        return [];
    }
}

// Decode Method from Input Data
function decodeMethod(inputData) {
    try {
        const decoded = iface.parseTransaction({ data: inputData });
        return decoded ? decoded.name : 'Unknown';
    } catch (err) {
        return 'Unknown';
    }
}

// Process and Save Transactions to CSV
async function saveTransactionsToCSV(transactions) {
    // Initialize CSV Writer
    const csvWriter = createObjectCsvWriter({
        path: 'transactions.csv', // Overwrites the file each time
        header: [
            { id: 'from', title: 'From' },
            { id: 'method', title: 'Method' },
            { id: 'to', title: 'To' },
            { id: 'value', title: 'Amount (BNB)' },
            { id: 'time', title: 'Time' },
            { id: 'txhash', title: 'TxHash' }
        ]
    });

    // Format Transactions for Writing
    const tableData = transactions.map(tx => ({
        from: tx.from,
        method: decodeMethod(tx.input),
        to: tx.to,
        value: (tx.value / 10 ** 18).toFixed(6),  // Convert from Wei to BNB
        time: new Date(tx.timeStamp * 1000).toLocaleString(),
        txhash: tx.hash
    }));

    // Write Data to CSV (overwrites the file)
    await csvWriter.writeRecords(tableData);
    console.log('Transactions saved to transactions.csv');
    return tableData;
}

// Display Transactions in Table
function displayTable(tableData) {
    const table = new Table({
        columns: [
            { name: 'from', alignment: 'left', title: 'From' },
            { name: 'method', alignment: 'left', title: 'Method' },
            { name: 'to', alignment: 'left', title: 'To' },
            { name: 'value', alignment: 'right', title: 'Amount (BNB)' },
            { name: 'time', alignment: 'left', title: 'Time' },
            { name: 'txhash', alignment: 'left', title: 'TxHash' }
        ]
    });

    table.addRows(tableData);
    table.printTable();
}

// Function to Read Transactions from CSV
function ReadFromCSV() {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream('transactions.csv')
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// API Endpoint to Send CSV Data
app.get("/royaldoller/txs", async (req, res) => {
    try {
        const data = await ReadFromCSV();
        res.json(data); // Send CSV data as JSON
    } catch (error) {
        console.error('Error reading CSV file:', error.message);
        res.status(500).json({ error: 'Error reading CSV file' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Main Execution
async function main() {
    setInterval(async()=>{
    const transactions = await fetchTransactions(CONTRACT_ADDRESS);
    if (transactions.length > 0) {
        const tableData = await saveTransactionsToCSV(transactions);
        displayTable(tableData);
    } else {
        console.log('No transactions found.');
    }
    }, 240000)
}

main();