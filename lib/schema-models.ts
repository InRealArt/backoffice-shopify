// Fonction pour récupérer les modèles du schéma Prisma 'landing'
export async function getSchemaModels() {
    // Liste des modèles du schéma 'landing', excluant Translation et Language
    const landingModels = [
        {
            name: 'Team',
            fields: [
                { name: 'role', type: 'String' },
                { name: 'intro', type: 'String' },
                { name: 'description', type: 'String' }
            ]
        },
        {
            name: 'Faq',
            fields: [
                { name: 'question', type: 'String' },
                { name: 'answer', type: 'String' }
            ]
        }
        // Ajoutez d'autres modèles du schéma 'landing' si nécessaire
    ]

    return landingModels
} 