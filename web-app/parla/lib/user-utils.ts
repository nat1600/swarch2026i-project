/**
 * Shared utilities for user profile handling
 */

export const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    return name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
};

interface Auth0User {
    given_name?: string;
    nickname?: string;
    name?: string;
    email?: string;
    picture?: string;
}

export const getDisplayName = (user: Auth0User | null | undefined): string => {
    if (!user) return "Usuario";
    return user.given_name || user.nickname || user.name || user.email || "Usuario";
};
