'use client'

import { useState, useEffect, Usable } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { getShopifyProductById } from '@/app/actions/shopify/shopifyActions'
import { getAuthCertificateByItemId, getItemByShopifyId, getUserByItemId, getAllCollections, createNftResource, getNftResourceByItemId } from '@/app/actions/prisma/prismaActions'
import { Toaster } from 'react-hot-toast'
import styles from './viewProduct.module.scss'
import React from 'react'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { uploadFilesToIpfs } from '@/app/actions/pinata/pinataActions'

type ParamsType = { id: string }

export default function ViewProductPage({ params }: { params: ParamsType }) {
  const router = useRouter()
  const { user } = useDynamicContext()
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [productOwner, setProductOwner] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [showUploadIpfsForm, setShowUploadIpfsForm] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [nftResource, setNftResource] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collection: '',
    image: null as File | null,
    certificate: null as File | null,
    intellectualProperty: false
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  const unwrappedParams = React.use(params as any) as ParamsType
  const id = unwrappedParams.id

  // Schéma de validation Zod pour les fichiers IPFS
  const ipfsFormSchema = z.object({
    name: z.string().min(1, "Le nom du NFT est obligatoire"),
    description: z.string().min(1, "La description du NFT est obligatoire"),
    collection: z.string().min(1, "La sélection d'une collection est obligatoire"),
    image: z.instanceof(File, { 
      message: "L'image du NFT est obligatoire" 
    }),
    certificate: z.instanceof(File, { 
      message: "Le certificat d'authenticité est obligatoire" 
    })
  })

  const fetchCollections = async () => {
    try {
      const collectionsData = await getAllCollections()
      console.log('Collections Data:', collectionsData)
      if (collectionsData && Array.isArray(collectionsData)) {
        setCollections(collectionsData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des collections:', error)
    }
  }

  useEffect(() => {
    if (!user?.email) {
      setError('Vous devez être connecté pour visualiser ce produit')
      setIsLoading(false)
      return
    }

    let isMounted = true
    
    const fetchProduct = async () => {
      try {
        // Extraire l'ID numérique si l'ID est au format GID
        const productId = params.id.includes('gid://shopify/Product/') 
          ? params.id.split('/').pop() 
          : params.id
        
        const result = await getShopifyProductById(productId as string)
        console.log('Shopify Product:', result)
        if (isMounted) {
          if (result.success && result.product) {
            setProduct(result.product)
            
            // Convertir result.product.id en nombre
            const shopifyProductId = typeof result.product.id === 'string' 
              ? BigInt(result.product.id.replace('gid://shopify/Product/', ''))
              : BigInt(result.product.id)

            // Rechercher l'Item associé 
            const itemResult = await getItemByShopifyId(shopifyProductId)
            console.log('Item Result:', itemResult)
            if (itemResult?.id) {
              setItem(itemResult)
              try {
                // Récupérer le certificat d'authenticité
                const certificateResult = await getAuthCertificateByItemId(itemResult.id)
                if (certificateResult && certificateResult.id) {
                  setCertificate(certificateResult)
                }
                
                // Récupérer l'utilisateur associé à cet item
                const ownerResult = await getUserByItemId(itemResult.id)
                if (ownerResult) {
                  setProductOwner(ownerResult)
                }
                
                // Récupérer le nftResource associé à cet item
                const nftResourceResult = await getNftResourceByItemId(itemResult.id)
                fetchCollections()
                console.log('NftResource Result:', nftResourceResult)
                if (nftResourceResult) {
                  setNftResource(nftResourceResult)
                  // Pré-remplir le formulaire avec les données existantes
                  if (nftResourceResult.status === 'UPLOADIPFS') {
                    setFormData(prevData => ({
                      ...prevData,
                      name: nftResourceResult.name || '',
                      description: nftResourceResult.description || '',
                      collection: nftResourceResult.collectionId?.toString() || ''
                    }))
                  }
                }
              } catch (certError) {
                console.error('Erreur lors de la récupération des données:', certError)
              }
            }
          } else {
            setError(result.message || 'Impossible de charger ce produit')
          }
          setIsLoading(false)
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement du produit:', error)
        if (isMounted) {
          setError(error.message || 'Une erreur est survenue')
          setIsLoading(false)
        }
      }
    }

    fetchProduct()
    
    return () => {
      isMounted = false
    }
  }, [id, user?.email])

  // Fonction pour charger les collections
  useEffect(() => {
    if (showUploadIpfsForm) {
      console.log('showUploadIpfsForm')
      fetchCollections()
    }
  }, [id, showUploadIpfsForm])

  // Fonction pour ouvrir le certificat dans un nouvel onglet
  const viewCertificate = () => {
    if (certificate && certificate.fileUrl) {
      window.open(certificate.fileUrl, '_blank')
    }
  }

  // Fonction pour gérer les changements de valeurs dans le formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else if (type === 'file') {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        setFormData(prev => ({
          ...prev,
          [name]: files[0]
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Fonction pour soumettre le formulaire
  const handleUploadOnIpfs = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})
    
    try {
      // Valider les fichiers avec Zod
      const result = ipfsFormSchema.safeParse({
        name: formData.name,
        description: formData.description,
        collection: formData.collection,
        image: formData.image,
        certificate: formData.certificate
      })
      
      if (!result.success) {
        // Transformer les erreurs Zod en objet d'erreurs
        const errors: Record<string, string> = {}
        result.error.issues.forEach(issue => {
          errors[issue.path[0].toString()] = issue.message
        })
        setFormErrors(errors)
        // Afficher un toast d'erreur
        toast.error('Veuillez corriger les erreurs du formulaire')
        return
      }
      
      // Afficher un toast de chargement
      const loadingToast = toast.loading('Upload des fichiers sur IPFS en cours...')
      
      // Appel du server action pour upload les fichiers
      const response = await uploadFilesToIpfs(
        formData.image as File,
        formData.certificate as File,
        formData.name || product.title || 'nft'
      )
      
      // Fermer le toast de chargement
      toast.dismiss(loadingToast)
      
      if (!response.success) {
        toast.error(response.error || 'Erreur lors de l\'upload sur IPFS')
        return
      }
      
      console.log('Image uploadée sur IPFS:', response.image)
      console.log('Certificat uploadé sur IPFS:', response.certificate)
      
      // Création d'un enregistrement dans la table NftResource
      const nftResourceToast = toast.loading('Enregistrement des ressources NFT...')
      
      try {
        if (!item || !item.id) {
          throw new Error('Impossible de trouver l\'item associé')
        }

        const collectionId = parseInt(formData.collection)
        if (isNaN(collectionId)) {
          throw new Error('ID de collection invalide')
        }
        
        // Appel à l'action serveur pour créer l'enregistrement NftResource
        const nftResourceResult = await createNftResource({
          itemId: item.id,
          imageUri: response.image.data.cid,
          certificateUri: response.certificate.data.cid,
          type: 'IMAGE',
          status: 'UPLOADIPFS',
          name: formData.name,
          description: formData.description,
          collectionId: collectionId
        })
        
        toast.dismiss(nftResourceToast)
        
        if (!nftResourceResult.success) {
          toast.error(nftResourceResult.error || 'Erreur lors de l\'enregistrement des ressources NFT')
          return
        }
        
        toast.success('Ressources NFT enregistrées avec succès')
        setShowUploadIpfsForm(false)
        
        // Rafraîchir la page pour afficher les changements
        router.refresh()
      } catch (resourceError) {
        toast.dismiss(nftResourceToast)
        console.error('Erreur lors de l\'enregistrement des ressources NFT:', resourceError)
        toast.error('Une erreur est survenue lors de l\'enregistrement des ressources NFT')
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload sur IPFS:', error)
      toast.error('Une erreur est survenue lors de l\'upload')
    }
  }

  // Fonction pour gérer l'action selon le statut de l'item
  const handleItemAction = async () => {
    if (item?.status === 'pending') {
      if (nftResource && nftResource.status === 'UPLOADIPFS') {
        // Si les ressources sont déjà sur IPFS, passer à l'étape suivante (mint)
        console.log('Ressources déjà sur IPFS, prêt pour le mint')
        // Logique pour mint NFT
        console.log('Mint NFT pour le produit:', product.id)
        // Appel à l'API de mint
      } else {
        // Afficher le formulaire pour upload sur IPFS
        setShowUploadIpfsForm(true)
      }
    } else {
      // Logique pour mint NFT
      console.log('Mint NFT pour le produit:', product.id)
      // Appel à l'API de mint
    }
  }

  // Détermine le texte du bouton en fonction du statut de l'item et du nftResource
  const getActionButtonText = () => {
    if (item?.status === 'pending') {
      if (nftResource?.status === 'UPLOADIPFS') {
        return 'Mint NFT'
      }
      return 'Préparer pour le mint'
    }
    return 'Lister sur la marketplace'
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Détails du produit</h1>
        
        {isLoading ? (
          <LoadingSpinner message="Chargement du produit..." />
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.productView}>
            <div className={styles.productGrid}>
              <div className={styles.imageSection}>
                {product?.imageUrl ? (
                  <div className={styles.imageContainer}>
                    <img src={product.imageUrl} alt={product.title} className={styles.productImage} />
                  </div>
                ) : (
                  <div className={styles.noImage}>Aucune image disponible</div>
                )}
              </div>
              
              <div className={styles.detailsSection}>
                <div className={styles.productInfo}>
                  <h2 className={styles.productTitle}>{product.title}</h2>
                  
                  {productOwner && (
                    <div className={styles.infoGroup}>
                      <span className={styles.label}>Propriétaire:</span>
                      <span className={styles.value}>
                        {productOwner.firstName} {productOwner.lastName}
                      </span>
                    </div>
                  )}
                  
                  <div className={styles.infoGroup}>
                    <span className={styles.label}>Prix:</span>
                    <span className={styles.value}>{product.price} {product.currency}</span>
                  </div>
                  
                  {certificate && (
                    <div className={styles.certificateSection}>
                      <span className={styles.label}>Certificat d'authenticité:</span>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={viewCertificate}
                        className={styles.certificateButton}
                      >
                        Voir le certificat
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className={styles.productDescription}>
                  <h3 className={styles.sectionTitle}>Description</h3>
                  <div 
                    className={styles.description}
                    dangerouslySetInnerHTML={{ __html: product.description || 'Aucune description disponible' }}
                  />
                </div>
                
                {item?.status === 'pending' && nftResource?.status === 'UPLOADIPFS' ? (
                  <div className={styles.nftResourceInfo}>
                    <h3 className={styles.formTitle}>Ressources NFT uploadées sur IPFS</h3>
                    
                    <div className={styles.formGroup}>
                      <label>Nom du NFT</label>
                      <input
                        type="text"
                        value={nftResource.name || ''}
                        readOnly
                        className={styles.formInput}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Description du NFT</label>
                      <textarea
                        value={nftResource.description || ''}
                        readOnly
                        className={styles.formTextarea}
                        rows={4}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Collection</label>
                      <input
                        type="text"
                        value={collections.find(c => c.id === nftResource.collectionId)?.name || 'Collection inconnue'}
                        readOnly
                        className={styles.formInput}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Image URI (IPFS)</label>
                      <div className={styles.ipfsLinkContainer}>
                        <input
                          type="text"
                          value={`ipfs://${nftResource.imageUri}`}
                          readOnly
                          className={styles.formInput}
                        />
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${nftResource.imageUri}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.viewLink}
                        >
                          Voir
                        </a>
                      </div>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Certificat URI (IPFS)</label>
                      <div className={styles.ipfsLinkContainer}>
                        <input
                          type="text"
                          value={`ipfs://${nftResource.certificateUri}`}
                          readOnly
                          className={styles.formInput}
                        />
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${nftResource.certificateUri}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.viewLink}
                        >
                          Voir
                        </a>
                      </div>
                    </div>
                    
                    <div className={styles.actionButtons}>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => router.back()}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="button" 
                        variant="primary"
                        onClick={handleItemAction}
                      >
                        Mint NFT
                      </Button>
                    </div>
                  </div>
                ) : showUploadIpfsForm && item?.status === 'pending' ? (
                  <div className={styles.listingFormContainer}>
                    <h3 className={styles.formTitle}>Upload sur IPFS</h3>
                    <form onSubmit={handleUploadOnIpfs} className={styles.listingForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="name">Nom du NFT</label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleFormChange}
                          required
                          className={styles.formInput}
                          placeholder="Nom du NFT"
                        />
                        {formErrors.name && (
                          <span className={styles.errorMessage}>{formErrors.name}</span>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="description">Description du NFT</label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          required
                          className={styles.formTextarea}
                          placeholder="Description du NFT"
                          rows={4}
                        />
                        {formErrors.description && (
                          <span className={styles.errorMessage}>{formErrors.description}</span>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="collection">Collection</label>
                        <select
                          id="collection"
                          name="collection"
                          value={formData.collection}
                          onChange={handleFormChange}
                          required
                          className={styles.formSelect}
                        >
                          <option value="">Sélectionnez une collection</option>
                          {collections.map((collection) => (
                            <option key={collection.id} value={collection.id.toString()}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.collection && (
                          <span className={styles.errorMessage}>{formErrors.collection}</span>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="image">Image du NFT</label>
                        <input
                          id="image"
                          name="image"
                          type="file"
                          accept="image/*"
                          onChange={handleFormChange}
                          required
                          className={styles.formFileInput}
                        />
                        {formErrors.image && (
                          <span className={styles.errorMessage}>{formErrors.image}</span>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="certificate">Certificat d'authenticité</label>
                        <input
                          id="certificate"
                          name="certificate"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFormChange}
                          required
                          className={styles.formFileInput}
                        />
                        {formErrors.certificate && (
                          <span className={styles.errorMessage}>{formErrors.certificate}</span>
                        )}
                      </div>
                      
                      <div className={styles.formActions}>
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={() => setShowUploadIpfsForm(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          type="submit" 
                          variant="primary"
                        >
                          Upload sur IPFS
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className={styles.actionButtons}>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => router.back()}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="button" 
                      variant="primary"
                      onClick={handleItemAction}
                    >
                      {getActionButtonText()}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 