import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for price drops every hour
crons.interval(
    "check-price-drops",
    { minutes: 60 },
    internal.notifications.checkPriceDrops
);

export default crons;
