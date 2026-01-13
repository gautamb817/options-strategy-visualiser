const express = require("express");
const router = express.Router();

router.post("/calculate", (req, res) => {
  const { type, strike, premium } = req.body;

  let prices = [];
  let payoff = [];

  // Generate price range
  for (let price = strike * 0.5; price <= strike * 1.5; price += 1) {
    prices.push(price);

    let pl = 0;

    if (type === "call") {
      pl = Math.max(price - strike, 0) - premium;
    } else if (type === "put") {
      pl = Math.max(strike - price, 0) - premium;
    }

    payoff.push(Number(pl.toFixed(2)));
  }

  res.json({ prices, payoff });
});

module.exports = router;
