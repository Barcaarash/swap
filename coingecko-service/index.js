const express = require("express");
const CoinGecko = require("coingecko-api");
const app = express(); const PORT = 4053; const CG = new CoinGecko();
let priceCache = { bnb: { price: 0, lastUpdated: 0 }, tokens: {} };
app.get("/api/bnb-price", async (req, res) => { try { const response = await CG.simple.price({ ids: ["binancecoin"], vs_currencies: ["usd"] }); if (response.success) { const price = response.data.binancecoin.usd; res.json({ success: true, price }); } else { res.status(500).json({ success: false }); } } catch (error) { res.status(500).json({ success: false }); } });
app.get("/api/token-price", async (req, res) => { try { const address = req.query.address; if (!address) { return res.status(400).json({ success: false, message: "Address required" }); } const response = await CG.simple.fetchTokenPrice({ contract_addresses: address, vs_currencies: "usd", platform: "binance-smart-chain" }); if (response.success && response.data[address.toLowerCase()]) { const price = response.data[address.toLowerCase()].usd; res.json({ success: true, price }); } else { res.status(500).json({ success: false }); } } catch (error) { res.status(500).json({ success: false }); } });
app.listen(PORT, () => { console.log("CoinGecko price service running on port", PORT); });
