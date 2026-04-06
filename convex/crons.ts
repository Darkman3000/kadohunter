import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

// Check for price drops every hour
crons.interval(
    "check-price-drops",
    { minutes: 60 },
    internal.notifications.checkPriceDrops
);

// Keep market dashboard/ticker data fresh for Hunter Net.
crons.interval(
    "refresh-market-feed",
    { minutes: 60 },
    api.prices.fetchMarketFeed
);

export default crons;
