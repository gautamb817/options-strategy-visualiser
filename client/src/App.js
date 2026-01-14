import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

function App() {
  const [data, setData] = useState([]);
  const [weightedData, setWeightedData] = useState([]);
  const [metrics, setMetrics] = useState(null);

  // Market parameters (Greeks intuition)
  const [spotPrice, setSpotPrice] = useState(100);
  const [volatility, setVolatility] = useState(0.2);
  const [timeToExpiry, setTimeToExpiry] = useState(1 / 12);

  useEffect(() => {
    axios
      .post("http://localhost:5000/api/payoff/calculate", {
        legs: [
          { type: "call", strike: 100, premium: 5, position: "buy" },
          { type: "put", strike: 100, premium: 4, position: "buy" },
        ],
        market: {
          spotPrice: Number(spotPrice),
          volatility: Number(volatility),
          timeToExpiry: Number(timeToExpiry),
        },
      })
      .then((res) => {
        // Payoff at expiry (STRUCTURE)
        const payoffData = res.data.prices.map((price, i) => ({
          price,
          payoff: res.data.payoff[i],
        }));

        // Probability-weighted payoff (LIKELIHOOD)
        const weightedPayoffData = res.data.prices.map((price, i) => ({
          price,
          weightedPayoff:
            res.data.payoff[i] * res.data.probabilities[i],
        }));

        setData(payoffData);
        setWeightedData(weightedPayoffData);

        setMetrics({
          maxProfit: res.data.maxProfit,
          maxLoss: res.data.maxLoss,
          breakEvenPoints: res.data.breakEvenPoints,
          probabilityOfProfit: res.data.probabilityOfProfit,
          expectedValue: res.data.expectedValue,
        });
      })
      .catch((err) => {
        console.error("Error fetching payoff data:", err);
      });
  }, [spotPrice, volatility, timeToExpiry]);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Option Strategy Visualiser</h1>
      <h2>Strategy: Long Straddle</h2>

      {/* Sliders */}
      <div style={{ marginBottom: "25px" }}>
        <label>
          Spot Price: <strong>{spotPrice}</strong>
          <br />
          <input
            type="range"
            min="70"
            max="130"
            step="1"
            value={spotPrice}
            onChange={(e) => setSpotPrice(Number(e.target.value))}
          />
        </label>

        <br /><br />

        <label>
          Volatility: <strong>{(volatility * 100).toFixed(0)}%</strong>
          <br />
          <input
            type="range"
            min="0.1"
            max="0.5"
            step="0.01"
            value={volatility}
            onChange={(e) => setVolatility(Number(e.target.value))}
          />
        </label>

        <br /><br />

        <label>
          Time to Expiry (years): <strong>{timeToExpiry.toFixed(2)}</strong>
          <br />
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={timeToExpiry}
            onChange={(e) => setTimeToExpiry(Number(e.target.value))}
          />
        </label>
      </div>

      {/* Metrics */}
      {metrics && (
        <div style={{ marginBottom: "30px" }}>
          <p><strong>Max Profit:</strong> Unlimited</p>
          <p><strong>Max Loss:</strong> {metrics.maxLoss}</p>
          <p>
            <strong>Break-even Points:</strong>{" "}
            {metrics.breakEvenPoints.join(", ")}
          </p>
          <p>
            <strong>Probability of Profit:</strong>{" "}
            {metrics.probabilityOfProfit}%
          </p>
          <p>
            <strong>Expected Value:</strong>{" "}
            {metrics.expectedValue}
          </p>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "flex", gap: "100px" ,marginLeft: "200px"}}>
        {/* Payoff at Expiry */}
        <div>
          <h3>Payoff at Expiry (Structure)</h3>
          <LineChart width={400} height={350} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="price"
              label={{
                value: "Stock Price at Expiry",
                position: "insideBottom",
                offset: -5,
              }} />
            <YAxis label={{
              value: "Profit / Loss",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }} />
            <Tooltip />
            <ReferenceLine y={0} stroke="black" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="payoff"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </div>

        {/* Probability-Weighted Payoff */}
        <div>
          <h3>Probability-Weighted Payoff (Likelihood)</h3>
          <LineChart width={400} height={350} data={weightedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="price"
              label={{
                value: "Stock Price at Expiry",
                position: "insideBottom",
                offset: -5,
              }} />
            <YAxis
              label={{
                value: "Expected Contribution",
                angle: -90,
                offset: 1,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }} />
            <Tooltip />
            <ReferenceLine y={0} stroke="black" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="weightedPayoff"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </div>
      </div>
    </div>
  );
}

export default App;
