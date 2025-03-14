// Configuration des routes protégées avec leur niveau d'accès requis
const protectedRoutes: Record<string, AccessLevel> = {
    // Routes admin
    "/admin": "admin",
    "/admin/shopify": "admin",
    "/admin/shopify/create-member": "admin",
    "/admin/shopify/users": "admin",

    // Routes artiste
    "/shopify/create": "artist",
    "/shopify/collection": "artist",
    "/shopify/artworks": "artist",
    "/shopify/users": "admin",

    // Routes nécessitant uniquement une connexion
    "/dashboard": "auth",
    "/profile": "auth",

    // Routes publiques (pas besoin de les lister, elles sont accessibles par défaut)
}

export type AccessLevel = "admin" | "artist" | "auth"

export function getRequiredAccessLevel(path: string): AccessLevel | null {
    // Vérifier les correspondances exactes
    if (path in protectedRoutes) {
        return protectedRoutes[path as keyof typeof protectedRoutes]
    }

    // Vérifier les préfixes de chemin
    for (const route in protectedRoutes) {
        if (path.startsWith(route + '/')) {
            return protectedRoutes[route as keyof typeof protectedRoutes]
        }
    }

    // Pas de restriction pour ce chemin
    return null
}

export default protectedRoutes 