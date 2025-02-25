'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { supabase } from '@/lib/supabase';
import ShopifyRequestModal from '../Shopify/ShopifyRequestModal';
import './Dashboard.css';
import toast from 'react-hot-toast';
import { submitShopifyRequest } from '@/app/actions/shopify/submitShopifyRequest';

export default function Dashboard() {
  const { user, primaryWallet } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(true);
  const [shopifyGranted, setShopifyGranted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkShopifyStatus = async () => {
      if (user && primaryWallet) {
        try {
          const { data, error } = await supabase
            .from('ShopifyUser')
            .select('isShopifyGranted')
            .eq('walletAddress', primaryWallet.address)
            .single();
          
          if (data) {
            setShopifyGranted(data.isShopifyGranted);
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error('Erreur lors de la vérification du statut Shopify:', err);
          setIsLoading(false);
        }
      }
    };

    checkShopifyStatus();
  }, [user, primaryWallet]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitShopifyRequest = async (formData: { firstName: string; lastName: string }) => {
    if (user?.email) {
        try {
          // Utiliser le server action à la place de l'appel API direct
          const result = await submitShopifyRequest({
            email: user.email,
            firstName: formData.firstName,
            lastName: formData.lastName
          });
    
          if (!result.success) {
            throw new Error(result.error || "Erreur inconnue");
          }
    
          // Fermer la modale après soumission
          setIsModalOpen(false);
          
          // Afficher un message de succès
          toast.success('Votre demande a été envoyée avec succès. Nous la traiterons dans les plus brefs délais.');
          
        } catch (error) {
          console.error('Erreur lors de l\'envoi du formulaire:', error);
          toast.error('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.');
        }
      }
  };


  if (isLoading) return <div className="dashboard-loading">Chargement...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Tableau de bord</h2>
      
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>Informations utilisateur</h3>
          <p><strong>Email:</strong> {user?.email || 'Non défini'}</p>
          <p><strong>Adresse wallet:</strong> {primaryWallet?.address || 'Non défini'}</p>
          <p><strong>Statut Shopify:</strong> {shopifyGranted ? 'Connecté' : 'Non connecté'}</p>
        </div>

        {!shopifyGranted && (
          <div className="dashboard-card">
            <h3>Connexion Shopify</h3>
            <p>Vous n'êtes pas encore un membre du Shopify d'InRealArt.</p>
            <button className="dashboard-button" onClick={handleOpenModal}>
              Devenir membre
            </button>
          </div>
        )}
      </div>

      <ShopifyRequestModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        userEmail={user?.email} 
        onSubmit={handleSubmitShopifyRequest} 
      />
    </div>
  );
}