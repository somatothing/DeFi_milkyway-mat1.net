require("dotenv").config();
const fetch = require("node-fetch");
const { ethers } = require("ethers");
const crypto = require("crypto");
const http = require("http");

const {
  OKX_API_KEY,
  OKX_API_SECRET,
  OKX_PASSPHRASE,
  ALCHEMY_API_URL,
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
} = process.env;

const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const contractABI = require("./MultiSwapABI.json");
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

async function startBot(req, res) {
  try {
    console.log("Fetching live token data...");
    const tickers = await fetchOKXTickers();

    console.log("Evaluating arbitrage opportunities...");
    const opportunities = await detectArbitrage(tickers);

    for (const { base, quote, profitMargin } of opportunities) {
      console.log(`Executing arbitrage for ${base} -> ${quote}, Profit Margin: ${profitMargin}%`);

      const path = [`0x${base}`, `0x${quote}`, "0xUSDT"];
      const receipt = await executeMultiHoopSwap(CONTRACT_ADDRESS, path, ethers.utils.parseUnits("0.001", 18));
      if (receipt) break;
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot executed successfully.");
  } catch (error) {
    console.error("Error in bot execution:", error.message);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Error in bot execution.");
  }
}

const server = http.createServer(startBot);
server.listen(8080, () => {
  console.log("Bot server running on port 8080");
});

// Fetch OKX tickers, detect arbitrage, and executeMultiHoopSwap remain unchanged.
