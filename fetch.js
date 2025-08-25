const axios = require("axios");
const cheerio = require("cheerio");

// Replace this with your API URL
const apiUrl = "https://bscscan.com/address/0x6b3b95B0c84f35c9c505fff8C2F35Ee2e502a44D";

const options = {
    method: 'GET',
    url: 'https://bscscan.com/address/0x6b3b95B0c84f35c9c505fff8C2F35Ee2e502a44D',
    headers: {
      Accept: '*/*',
      'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
      'Content-Type': 'application/json'
    },
    data: {
      tx_bytes: 'CpsCCpgCCiovY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dDcmVhdGVWYWxpZGF0b3IS6QEKFQoKc292ZXJlaWduMhIHS2V5YmFzZRI7ChIxMDAwMDAwMDAwMDAwMDAwMDASEjIwMDAwMDAwMDAwMDAwMDAwMBoRMTAwMDAwMDAwMDAwMDAwMDAaATEqNGNvc21vc3ZhbG9wZXIxazh1cHl4am0wM2RnYWN0bHg4YTIzdjhjY3Q5NnZjNWRqd2p1NnAyQwodL2Nvc21vcy5jcnlwdG8uZWQyNTUxOS5QdWJLZXkSIgog565Ez+ww/v0ih/aUGTZuPW6HRR3+O/oMhZvV83BA5xQ6FQoFdXNvaWQSDDEwMDAwMDAwMDAwMBJlCk4KRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDu4wBbxotWSxDeN/AUQCMRo49pZtFcjMFXgQPJ/L/qQQSBAoCCAESEwoNCgV1c29pZBIEMjAwMBDAmgwaQIl3DM5GaJo7wFcaIM3qiY/QBilRcQvWeElhnBUopIDyat+hl6gS/t/1hzzWoPdxUvQ3Q6AFUqzT0fPPTmrfgts='
    }
  };

async function extractTxData() {
  try {
    // Fetch HTML from API
    const response = await axios.request(options);
    const html = response.data;

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Select tbody and iterate over rows
    const transactions = [];
    let newtransactions = [];
    $("tbody tr").each((index, element) => {
      const txHash = $(element).find("td:nth-child(2)").text().trim();
      const time = $(element).find("td:nth-child(5)").text().trim();
      const txType = $(element).find("td:nth-child(3)").text().trim();
      const ago = $(element).find("td:nth-child(6)").text().trim();

      transactions.push({ txHash, time, ago, txType });
      newtransactions = transactions.filter((tx) => tx.txType === "Burn" || tx.txType === "Mint")
    });

    console.log(newtransactions);
    console.log(newtransactions.length);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

extractTxData();


async function saveTransactionsToCSV(transactions) {
    // Initialize CSV Writer
    const csvWriter = createObjectCsvWriter({
        path: 'transactions.csv', // Overwrites the file each time
        header: [
            { id: 'txHash', title: 'txHash' },
            { id: 'txType', title: 'txType' },
            { id: 'ago', title: 'ago' },
            { id: 'time', title: 'time' },
        ]
    });

    // Format Transactions for Writing
    const tableData = transactions.map(tx => ({
        txHash: tx.txHash,
        time: tx.time,
        txType: tx.txType,
        ago: tx.ago
    }));

    // Write Data to CSV (overwrites the file)
    await csvWriter.writeRecords(tableData);
    console.log('Transactions saved to transactions.csv');
    return tableData;
}