// const express = require("express");
// const router = express.Router();

// router.post("/calculate", (req, res) => {
//   const { type, strike, premium } = req.body;

//   let prices = [];
//   let payoff = [];

//   // Generate price range
//   for (let price = strike * 0.5; price <= strike * 1.5; price += 1) {
//     prices.push(price);

//     let pl = 0;

//     if (type === "call") {
//       pl = Math.max(price - strike, 0) - premium;
//     } else if (type === "put") {
//       pl = Math.max(strike - price, 0) - premium;
//     }

//     payoff.push(Number(pl.toFixed(2)));
//   }

//   res.json({ prices, payoff });
// });

// module.exports = router;

const express = require("express");
const router = express.Router();

router.post("/calculate", (req, res) => {
  const { legs } = req.body;

  const minStrike = Math.min(...legs.map(l => l.strike));
  const maxStrike = Math.max(...legs.map(l => l.strike));

  let prices = [];
  let payoff = [];

  for (let price = minStrike * 0.5; price <= maxStrike * 1.5; price += 1) {
    prices.push(price);

    let totalPL = 0;

    legs.forEach(leg => {
      let pl = 0;

      if (leg.type === "call") {
        pl = Math.max(price - leg.strike, 0) - leg.premium;
      }

      if (leg.type === "put") {
        pl = Math.max(leg.strike - price, 0) - leg.premium;
      }

      if (leg.position === "sell") {
        pl = -pl;
      }

      totalPL += pl;
    });

    payoff.push(Number(totalPL.toFixed(2)));
  }

  res.json({ prices, payoff });
});

module.exports = router;
