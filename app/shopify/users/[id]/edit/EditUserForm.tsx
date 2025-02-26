'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateShopifyUser } from '@/app/actions/prisma/prismaActions'
import { 
  getShopifyCollectionByTitle,
  updateShopifyCollection
} from '@/app/actions/shopify/shopifyActions'
import { ShopifyUser } from '@prisma/client'
import styles from './EditUserForm.module.scss'

// Schéma de validation
const formSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Format d\'email invalide'),
  role: z.string().nullable().optional(),
  isShopifyGranted: z.boolean().default(false),
  collectionDescription: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

interface EditUserFormProps {
  user: ShopifyUser
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [collectionTitle, setCollectionTitle] = useState<string | null>(null)
  const [collectionDescription, setCollectionDescription] = useState<string | null>(null)
  const [initialDescription, setInitialDescription] = useState<string | null>(null)
  const [isLoadingCollection, setIsLoadingCollection] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: user.id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || null,
      isShopifyGranted: user.isShopifyGranted || false,
      collectionDescription: ''
    }
  })

  // Surveiller la valeur de isShopifyGranted pour l'affichage conditionnel
  const isShopifyGranted = watch('isShopifyGranted')
  const currentDescription = watch('collectionDescription')

  // Récupérer les informations de la collection basée sur le nom de l'utilisateur
  useEffect(() => {
    let isMounted = true
    setIsLoadingCollection(true)
    
    const fetchCollectionInfo = async () => {
      if (!user.firstName || !user.lastName) {
        setIsLoadingCollection(false)
        return
      }

      try {
        const collectionTitle = `${user.firstName} ${user.lastName}`.trim()
        const result = await getShopifyCollectionByTitle(collectionTitle)
        
        if (result.success && result.collection && isMounted) {
          setCollectionId(result.collection.id)
          setCollectionTitle(result.collection.title)
          
          // Stocker la description dans le state component pour l'affichage
          const description = result.collection.body_html || ''
          setCollectionDescription(description)
          setInitialDescription(description)
          
          // Définir manuellement la valeur des éléments DOM pour éviter d'utiliser setValue
          setTimeout(() => {
            const textArea = document.getElementById('collectionDescription') as HTMLTextAreaElement
            if (textArea && isMounted) {
              textArea.value = description
              
              // Déclencher un événement pour que React Hook Form reconnaisse le changement
              const event = new Event('input', { bubbles: true })
              textArea.dispatchEvent(event)
            }
          }, 100)
          
          console.log('Collection trouvée:', result.collection)
        } else if (isMounted) {
          console.log('Aucune collection trouvée pour:', collectionTitle)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la collection:', error)
      } finally {
        if (isMounted) {
          setIsLoadingCollection(false)
        }
      }
    }

    fetchCollectionInfo()
    
    // Nettoyage pour éviter des mises à jour sur un composant démonté
    return () => {
      isMounted = false
    }
  }, [user.firstName, user.lastName])

  // Fonction de soumission du formulaire
  const onSubmit = async (data: FormValues) => {
    console.log('Début de la soumission du formulaire', data)
    setIsSubmitting(true)

    try {
      // Vérifier que toutes les données sont présentes
      if (!data || !data.id) {
        throw new Error('Données de formulaire incomplètes')
      }

      // S'assurer que tous les champs requis sont présents
      const payload = {
        id: data.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        role: data.role || null,
        isShopifyGranted: data.isShopifyGranted,
        walletAddress: user.walletAddress || ''
      }

      console.log('Payload à envoyer:', payload)

      // Mettre à jour l'utilisateur avec le payload complet
      const userResult = await updateShopifyUser(payload)

      if (!userResult.success) {
        throw new Error(userResult.message)
      }
      
      // Vérifier si nous devons mettre à jour la description de la collection
      if (data.isShopifyGranted && collectionId && data.collectionDescription !== initialDescription) {
        console.log('Mise à jour de la description de collection:', data.collectionDescription)
        
        const updateResult = await updateShopifyCollection(collectionId, {
          description: data.collectionDescription || ''
        })
        
        if (!updateResult.success) {
          console.error('Erreur lors de la mise à jour de la collection:', updateResult.message)
          toast.error('Erreur lors de la mise à jour de la collection')
        } else {
          toast.success('Utilisateur et collection mis à jour avec succès')
        }
      } else {
        toast.success('Utilisateur mis à jour avec succès')
      }
      
      // Rediriger après 1 seconde
      setTimeout(() => {
        router.push('/shopify/users')
        router.refresh()
      }, 1000)
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error(error.message || 'Une erreur est survenue lors de la mise à jour')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Modifier l'utilisateur</h1>
          <p className={styles.formSubtitle}>
            Modifier les informations de {user.firstName} {user.lastName}
          </p>
        </div>

        {/* Champ caché pour stocker la description initiale */}
        <input 
          type="hidden"
          id="initialDescription"
          value={initialDescription || ''}
        />

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.formLabel}>
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName')}
              className={`${styles.formInput} ${errors.firstName ? styles.formInputError : ''}`}
            />
            {errors.firstName && (
              <p className={styles.formError}>{errors.firstName.message}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lastName" className={styles.formLabel}>
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName')}
              className={`${styles.formInput} ${errors.lastName ? styles.formInputError : ''}`}
            />
            {errors.lastName && (
              <p className={styles.formError}>{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`${styles.formInput} ${errors.email ? styles.formInputError : ''}`}
          />
          {errors.email && (
            <p className={styles.formError}>{errors.email.message}</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="role" className={styles.formLabel}>
            Rôle
          </label>
          <select
            id="role"
            {...register('role')}
            className={styles.formSelect}
          >
            <option value="">Sélectionner un rôle</option>
            <option value="admin">Administrateur</option>
            <option value="artist">Artiste</option>
            <option value="galleryManager">Gestionnaire de galerie</option>
          </select>
          {errors.role && (
            <p className={styles.formError}>{errors.role.message}</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.checkboxContainer}>
            <input
              id="isShopifyGranted"
              type="checkbox"
              {...register('isShopifyGranted')}
              className={styles.checkboxInput}
            />
            <label htmlFor="isShopifyGranted" className={styles.checkboxLabel}>
              Accès Shopify accordé
            </label>
          </div>
          <p className={styles.helpText}>
            Cochez cette case pour donner à cet utilisateur l'accès à Shopify.
          </p>
        </div>

        {/* Section d'information sur la collection Shopify - conditionnelle selon isShopifyGranted */}
        {isShopifyGranted && (
          <>
            {isLoadingCollection ? (
              <div className={styles.loadingContainer}>
                Chargement des informations de la collection...
              </div>
            ) : collectionId ? (
              <div className={styles.collectionSection}>
                <h2 className={styles.sectionTitle}>Collection Shopify associée</h2>
                
                <div className={styles.infoBox}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>ID:</span>
                    <span className={styles.infoValue}>{collectionId}</span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Titre:</span>
                    <span className={styles.infoValue}>{collectionTitle}</span>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="collectionDescription" className={styles.formLabel}>
                    Description de la collection
                  </label>
                  <textarea
                    id="collectionDescription"
                    {...register('collectionDescription')}
                    className={styles.formTextarea}
                    rows={5}
                  />
                  <p className={styles.infoText}>
                    Cette description est affichée sur la page de la collection Shopify.
                    Vous pouvez utiliser du HTML pour mettre en forme le texte.
                  </p>
                  {currentDescription !== initialDescription && (
                    <p className={styles.changeIndicator}>
                      La description a été modifiée. Enregistrez pour appliquer les changements.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.noCollectionBox}>
                Aucune collection Shopify n'est associée à cet utilisateur.
                Une collection sera créée automatiquement lors de l'enregistrement.
              </div>
            )}
          </>
        )}

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={handleCancel}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </div>
  )
} 