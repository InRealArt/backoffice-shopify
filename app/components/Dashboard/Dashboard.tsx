'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import styles from './Dashboard.module.scss';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import Button from '../Button/Button';
import { DashboardCard } from './DashboardCard/DashboardCard'
import { getPendingItemsCount, getUserMintedItemsCount, getUserListedItemsCount } from '@/app/actions/prisma/prismaActions'
import { useIsAdmin } from '@/app/hooks/useIsAdmin';

export default function Dashboard() {
  const { user, primaryWallet } = useDynamicContext();
  const [shopifyGranted, setShopifyGranted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminNavigating, setIsAdminNavigating] = useState(false);
  const router = useRouter();
  const [pendingItemsCount, setPendingItemsCount] = useState(0)
  const [mintedItemsCount, setMintedItemsCount] = useState(0)
  const [listedItemsCount, setListedItemsCount] = useState(0)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [isLoadingUserCounts, setIsLoadingUserCounts] = useState(true)
  const { isAdmin, isLoading } = useIsAdmin()

  const truncateAddress = (address: string | undefined) => {
    if (!address) return 'Non défini';
    const start = address.substring(0, 6);
    const end = address.substring(address.length - 4);
    return `${start}...${end}`;
  };

  useEffect(() => {
    const fetchPendingItems = async () => {
      if (isAdmin) {
        try {
          const { count } = await getPendingItemsCount()
          setPendingItemsCount(count)
        } catch (error) {
          console.error('Erreur lors de la récupération du nombre d\'items:', error)
        } finally {
          setIsLoadingCount(false)
        }
      }
    }

    fetchPendingItems()
  }, [isAdmin])

  useEffect(() => {
    const fetchUserItemsStats = async () => {
      if (!isAdmin && user?.userId) {
        try {
          const userId = parseInt(user.userId);
          const mintedResult = await getUserMintedItemsCount(userId);
          const listedResult = await getUserListedItemsCount(userId);
          
          setMintedItemsCount(mintedResult.count);
          setListedItemsCount(listedResult.count);
        } catch (error) {
          console.error('Erreur lors de la récupération des statistiques d\'items:', error)
        } finally {
          setIsLoadingUserCounts(false)
        }
      }
    }

    fetchUserItemsStats()
  }, [isAdmin, user])

  const handleAdminShowUsers = () => {
    setIsAdminNavigating(true);
    router.push('/admin/shopify/users');
  };

  if (isLoading) return <LoadingSpinner fullPage message="Chargement du tableau de bord..." />;

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.dashboardTitle}>Tableau de bord</h2>
      
      <div className={styles.dashboardContent}>
        <DashboardCard title="Informations utilisateur">
          <p><strong>Email:</strong> {user?.email || 'Non défini'}</p>
          <p><strong>Adresse wallet:</strong> <span className={styles.smallText}>{truncateAddress(primaryWallet?.address)}</span></p>
        </DashboardCard>

        {isAdmin ? (
          <>
            <DashboardCard title="Panneau d'Administration">
              <p>Voir les utilisateurs et leurs informations.</p>
              <Button
                onClick={handleAdminShowUsers}
                isLoading={isAdminNavigating}
                loadingText="Chargement..."
              >
                Voir les utilisateurs
              </Button>
            </DashboardCard>

            <DashboardCard title="Items en attente">
              {isLoadingCount ? (
                <p>Chargement du nombre d'items...</p>
              ) : (
                <>
                  <p>Nombre d'items en attente de validation : <strong>{pendingItemsCount}</strong></p>
                  <Button 
                    onClick={() => router.push('/marketplace/productsListing')}
                  >
                    Voir les items en attente
                  </Button>
                </>
              )}
            </DashboardCard>
          </>
        ) : (
          <>
            <DashboardCard title="Ma Collection">
              <p>Explorez et gérez votre collection d'œuvres d'art.</p>
              <Button onClick={() => router.push('/shopify/collection')}>
                Voir ma collection d'œuvres d'art
              </Button>
            </DashboardCard>
            
            <DashboardCard title="Création d'œuvre">
              <p>Créez et publiez une nouvelle œuvre d'art dans Shopify.</p>
              <button 
                className={styles.dashboardButton} 
                onClick={() => router.push('/shopify/createArtwork')}
              >
                Créer une œuvre dans Shopify
              </button>
            </DashboardCard>

            <DashboardCard title="Statut de mes œuvres">
              {isLoadingUserCounts ? (
                <p>Chargement des statistiques...</p>
              ) : (
                <>
                  <p>Œuvres mintées : <strong>{mintedItemsCount}</strong></p>
                  <p>Œuvres en vente : <strong>{listedItemsCount}</strong></p>
                  <Button 
                    onClick={() => router.push('/shopify/collection')}
                  >
                    Voir le détail
                  </Button>
                </>
              )}
            </DashboardCard>
          </>
        )}
      </div>
    </div>
  );
}