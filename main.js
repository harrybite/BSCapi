const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');

const express = require("express");
const cors = require("cors");
const csvParser = require('csv-parser'); 

const PORT = 8001;
const app = express();
app.use(cors());
app.use(express.json());

const csvFilePath = path.join(__dirname, 'transactions.csv');
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
app.get("/royaldoller/txs", async (req, res) => {
    try {
        const data = await ReadFromCSV();
        console.log('CSV data read successfully:', data);
        res.json(data); // Send CSV data as JSON
    } catch (error) {
        console.error('Error reading CSV file:', error.message);
        res.status(500).json({ error: 'Error reading CSV file' });
    }
});
app.post("/royaldoller/tx", async (req, res) => {
    const { txhash, txType, Amount, Time, Network, explorer } = req.body;
    if (!txhash || !txType || !Amount || !Time || !Network || !explorer) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'txhash', title: 'txhash' },
            { id: 'txType', title: 'txType' },
            { id: 'Amount', title: 'Amount' },
            { id: 'Time', title: 'Time' },
            { id: 'Network', title: 'Network' },
            { id: 'explorer', title: 'explorer' }
        ],
        append: true
    });

    try {
        await csvWriter.writeRecords([{ txhash, txType, Amount, Time, Network, explorer }]);
        res.json({ message: "Transaction saved" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save transaction" });
    }
});

app.get("/", (req, res) => {    
    res.send("Welcome to the RoyalDoller Transaction API");
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
