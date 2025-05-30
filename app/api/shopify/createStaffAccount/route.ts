import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeJwtToken } from '../../auth/utils';
import { BackofficeUserRoles } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, notificationId } = await request.json();

      // Récupérer le token depuis les en-têtes de la requête
      const authToken = request.headers.get('Authorization')?.replace('Bearer ', '')
  
      if (!authToken) {
          return NextResponse.json(
              { message: 'Non authentifié. Veuillez vous connecter.' },
              { status: 401 }
          )
      }
      else {
          // Décoder le JWT pour extraire les informations
          const {user, message} = await decodeJwtToken(authToken)
          if (!user || typeof user !== 'object') {
              return NextResponse.json(
                  { message: 'Token invalide ou expiré' },
                  { status: 401 }
              )
          }   
          console.log('User authentifié:', user)
          if (user.role !== BackofficeUserRoles.admin) {
              return NextResponse.json(
                  { message: 'Accès refusé. Vous n\'êtes pas autorisé à effectuer cette action.' },
                  { status: 403 }
              )
          }
      }
    
    console.log("DATA : ", email, firstName, lastName, notificationId)
    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Récupérer les identifiants Shopify depuis les variables d'environnement
    const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL;
    const shopifyAdminApiAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    console.log("SHOPIFY STORE URL : ", shopifyStoreUrl)
    console.log("SHOPIFY ADMIN API ACCESS TOKEN : ", shopifyAdminApiAccessToken)

    if (!shopifyStoreUrl || !shopifyAdminApiAccessToken) {
      return NextResponse.json({ 
        error: 'Configuration Shopify manquante' 
      }, { status: 500 });
    }

    // Construire la requête GraphQL pour créer un compte staff
    const mutation = `
      mutation staffMemberCreate($input: StaffMemberInput!) {
        staffMemberCreate(input: $input) {
          staffMember {
            id
            firstName
            lastName
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Paramètres pour la création du compte staff
    const variables = {
      input: {
        email: email,
        firstName: firstName,
        lastName: lastName,
        // Définir ici les permissions nécessaires
        permissions: ["products"]
      }
    };

    // Effectuer la requête GraphQL à l'API Admin de Shopify
    const graphqlResponse = await fetch(
      `https://${shopifyStoreUrl}/admin/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminApiAccessToken
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const graphqlData = await graphqlResponse.json();

    // Vérifier s'il y a des erreurs dans la réponse GraphQL
    if (graphqlData.errors || (graphqlData.data?.staffMemberCreate?.userErrors?.length > 0)) {
      const errorMessage = graphqlData.errors?.[0]?.message || 
                          graphqlData.data?.staffMemberCreate?.userErrors?.[0]?.message ||
                          'Erreur inconnue lors de la création du staff';
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }


    return NextResponse.json({
      success: true,
      staffMember: graphqlData.data.staffMemberCreate.staffMember
    });

  } catch (error) {
    console.error('Erreur lors de la création du compte staff:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur inconnue' 
    }, { status: 500 });
  }
}