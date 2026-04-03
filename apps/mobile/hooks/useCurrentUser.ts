import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * Fetch the current Convex user, skipping the query when auth isn't ready.
 */
export function useCurrentUser(isAuthLoaded: boolean, isSignedIn: boolean | undefined) {
    return useQuery(
        api.users.getCurrentUser,
        isAuthLoaded && isSignedIn ? {} : "skip"
    );
}