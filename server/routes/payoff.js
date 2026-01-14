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

// const express = require("express");
// const router = express.Router();

// router.post("/calculate", (req, res) => {
//   const { legs } = req.body;

//   const minStrike = Math.min(...legs.map(l => l.strike));
//   const maxStrike = Math.max(...legs.map(l => l.strike));

//   let prices = [];
//   let payoff = [];

//   for (let price = minStrike * 0.5; price <= maxStrike * 1.5; price += 1) {
//     prices.push(price);

//     let totalPL = 0;

//     legs.forEach(leg => {
//       let pl = 0;

//       if (leg.type === "call") {
//         pl = Math.max(price - leg.strike, 0) - leg.premium;
//       }

//       if (leg.type === "put") {
//         pl = Math.max(leg.strike - price, 0) - leg.premium;
//       }

//       if (leg.position === "sell") {
//         pl = -pl;
//       }

//       totalPL += pl;
//     });

//     payoff.push(Number(totalPL.toFixed(2)));
//   }

//   res.json({ prices, payoff });
// });

// module.exports = router;
// const express = require("express");
// const router = express.Router();

// router.post("/calculate", (req, res) => {
//   const { legs } = req.body;

//   if (!legs || legs.length === 0) {
//     return res.status(400).json({ error: "No option legs provided" });
//   }

//   const strikes = legs.map(l => l.strike);
//   const minStrike = Math.min(...strikes);
//   const maxStrike = Math.max(...strikes);

//   let prices = [];
//   let payoff = [];

//   for (let price = minStrike * 0.5; price <= maxStrike * 1.5; price += 1) {
//     prices.push(price);

//     let totalPL = 0;

//     legs.forEach(leg => {
//       let pl = 0;

//       if (leg.type === "call") {
//         pl = Math.max(price - leg.strike, 0) - leg.premium;
//       }

//       if (leg.type === "put") {
//         pl = Math.max(leg.strike - price, 0) - leg.premium;
//       }

//       if (leg.position === "sell") {
//         pl = -pl;
//       }

//       totalPL += pl;
//     });

//     payoff.push(Number(totalPL.toFixed(2)));
//   }

//   // 🔹 Risk Metrics
//   const maxProfit = Math.max(...payoff);
//   const maxLoss = Math.min(...payoff);

//   // 🔹 Break-even detection
//   let breakEvenPoints = [];

//   for (let i = 1; i < payoff.length; i++) {
//     if (
//       (payoff[i - 1] < 0 && payoff[i] >= 0) ||
//       (payoff[i - 1] > 0 && payoff[i] <= 0)
//     ) {
//       breakEvenPoints.push(prices[i]);
//     }
//   }
  

//   res.json({
//     prices,
//     payoff,
//     maxProfit,
//     maxLoss,
//     breakEvenPoints
//   });
// });

// module.exports = router;
const express = require("express");
const router = express.Router();

router.post("/calculate", (req, res) => {
  const { legs } = req.body;

  if (!legs || legs.length === 0) {
    return res.status(400).json({ error: "No option legs provided" });
  }

  // ----------------------------
  // Generate price range
  // ----------------------------
  const strikes = legs.map(l => l.strike);
  const minStrike = Math.min(...strikes);
  const maxStrike = Math.max(...strikes);

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

  // ----------------------------
  // Risk Metrics
  // ----------------------------
  const maxProfit = Math.max(...payoff);
  const maxLoss = Math.min(...payoff);

  // ----------------------------
  // Break-even detection
  // ----------------------------
  let breakEvenPoints = [];

  for (let i = 1; i < payoff.length; i++) {
    if (
      (payoff[i - 1] < 0 && payoff[i] >= 0) ||
      (payoff[i - 1] > 0 && payoff[i] <= 0)
    ) {
      breakEvenPoints.push(prices[i]);
    }
  }

  // ----------------------------
  // Probability Model (Normal Distribution)
  // ----------------------------
  const currentPrice =
    strikes.reduce((sum, s) => sum + s, 0) / strikes.length;

  const volatility = 0.2; // 20% annual volatility
  const time = 1 / 12; // 1 month to expiry

  const stdDev = currentPrice * volatility * Math.sqrt(time);

  function normalPDF(x, mean, std) {
    return (
      (1 / (std * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((x - mean) / std, 2))
    );
  }

  // Calculate raw probabilities
  let probabilities = prices.map(price =>
    normalPDF(price, currentPrice, stdDev)
  );

  // Normalize probabilities
  const totalProb = probabilities.reduce((a, b) => a + b, 0);
  probabilities = probabilities.map(p => p / totalProb);

  // ----------------------------
  // Probability of Profit & EV
  // ----------------------------
  let probabilityOfProfit = 0;
  let expectedValue = 0;

  payoff.forEach((pl, i) => {
    if (pl > 0) probabilityOfProfit += probabilities[i];
    expectedValue += pl * probabilities[i];
  });

  // ----------------------------
  // Response
  // ----------------------------
  res.json({
    prices,
    payoff,
    maxProfit,
    maxLoss,
    breakEvenPoints,
    probabilityOfProfit: Number((probabilityOfProfit * 100).toFixed(2)),
    expectedValue: Number(expectedValue.toFixed(2)),
  });
});

module.exports = router;
