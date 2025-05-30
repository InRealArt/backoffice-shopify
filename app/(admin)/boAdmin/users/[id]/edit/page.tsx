import { Suspense } from 'react'
import { getBackofficeUserById } from '@/lib/actions/prisma-actions'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import EditUserForm from './EditUserForm';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const userId = resolvedParams.id || '';
  
  if (!userId) {
    return <div>ID utilisateur non valide</div>;
  }
  
  try {
    const user = await getBackofficeUserById(userId);
    
    if (!user) {
      return (
        <div className="error-container">Utilisateur non trouvé</div>
      )
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <div className="page-container">
          <EditUserForm user={user} />
        </div>
      </Suspense>
    )
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return <div>Une erreur s'est produite</div>;
  }
} 