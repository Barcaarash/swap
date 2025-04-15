const http = require("http");

const PORT = 4053;

const server = http.createServer((req, res) => {
  // Always end with carriage return and newline
  res.setHeader("Content-Type", "application/json");
  if (req.url.includes("/api/bnb-price")) {
    console.log("BNB price requested");
    res.end(JSON.stringify({success: true, price: 586.42}) + "
");
  } else if (req.url.includes("/api/token-price")) {
    console.log("Token price requested");
    res.end(JSON.stringify({success: true, price: 2.34}) + "
");
  } else {
    res.end(JSON.stringify({success: false}) + "
");
  }
});

server.listen(PORT, () => {
  console.log("Minimal server running on port", PORT);
});