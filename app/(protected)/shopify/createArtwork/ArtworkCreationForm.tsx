'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { artworkSchema, ArtworkFormData } from './schema'
import { createArtwork } from '@/app/actions/shopify/shopifyActions'
import toast from 'react-hot-toast'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import styles from './ArtworkCreationForm.module.scss'

export default function ArtworkCreationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useDynamicContext()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ArtworkFormData>({
    resolver: zodResolver(artworkSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      artist: '',
      medium: '',
      dimensions: '',
      year: new Date().getFullYear().toString(),
      edition: '',
      tags: '',
      images: undefined
    }
  })
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    // Prévisualisation des images
    const imageFiles = Array.from(files)
    const imageUrls: string[] = []
    
    imageFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      imageUrls.push(url)
    })
    
    setPreviewImages(imageUrls)
  }
  
  const onSubmit = async (data: ArtworkFormData) => {
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      
      // Ajouter les champs textuels
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && value) {
          formData.append(key, value.toString())
        }
      })
      
      // Ajouter les images
      if (data.images && data.images.length > 0) {
        Array.from(data.images).forEach((file, index) => {
          formData.append(`image-${index}`, file)
        })
      }
      
      // AJOUT IMPORTANT: Ajouter manuellement l'email de l'utilisateur
      formData.append('userEmail', user?.email || '')
      
      // Envoyer au serveur
      const result = await createArtwork(formData)
      
      if (result.success) {
        toast.success(`L'œuvre "${data.title}" a été créée avec succès!`)
        reset()
        setPreviewImages([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error(`Erreur: ${result.message}`)
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'œuvre:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.formGrid}>
          {/* Titre */}
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.formLabel}>
              Titre de l'œuvre*
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={`${styles.formInput} ${errors.title ? styles.formInputError : ''}`}
              placeholder="Sans titre #12"
            />
            {errors.title && (
              <p className={styles.formError}>{errors.title.message}</p>
            )}
          </div>
          
          {/* Artiste */}
          <div className={styles.formGroup}>
            <label htmlFor="artist" className={styles.formLabel}>
              Artiste*
            </label>
            <input
              id="artist"
              type="text"
              {...register('artist')}
              className={`${styles.formInput} ${errors.artist ? styles.formInputError : ''}`}
              placeholder="Nom de l'artiste"
            />
            {errors.artist && (
              <p className={styles.formError}>{errors.artist.message}</p>
            )}
          </div>
        </div>
        
        {/* Description */}
        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.formLabel}>
            Description*
          </label>
          <textarea
            id="description"
            {...register('description')}
            className={`${styles.formTextarea} ${errors.description ? styles.formInputError : ''}`}
            rows={4}
            placeholder="Description détaillée de l'œuvre..."
          />
          {errors.description && (
            <p className={styles.formError}>{errors.description.message}</p>
          )}
        </div>
        
        {/* Section Tarification */}
        <div className={styles.formSectionTitle}>Tarification</div>
        <div className={styles.formSectionContent}>
          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.formLabel}>
              Prix (€)*
            </label>
            <input
              id="price"
              type="text"
              {...register('price')}
              className={`${styles.formInput} ${errors.price ? styles.formInputError : ''}`}
              placeholder="1500"
            />
            {errors.price && (
              <p className={styles.formError}>{errors.price.message}</p>
            )}
          </div>
        </div>
        
        {/* Section Caractéristiques */}
        <div className={styles.formSectionTitle}>Caractéristiques</div>
        <div className={styles.formSectionContent}>
          <div className={styles.formGrid}>
            {/* Support/Medium */}
            <div className={styles.formGroup}>
              <label htmlFor="medium" className={styles.formLabel}>
                Support/Medium*
              </label>
              <input
                id="medium"
                type="text"
                {...register('medium')}
                className={`${styles.formInput} ${errors.medium ? styles.formInputError : ''}`}
                placeholder="Acrylique sur toile"
              />
              {errors.medium && (
                <p className={styles.formError}>{errors.medium.message}</p>
              )}
            </div>
            
            {/* Dimensions */}
            <div className={styles.formGroup}>
              <label htmlFor="dimensions" className={styles.formLabel}>
                Dimensions (cm)*
              </label>
              <input
                id="dimensions"
                type="text"
                {...register('dimensions')}
                className={`${styles.formInput} ${errors.dimensions ? styles.formInputError : ''}`}
                placeholder="100 x 80 x 2"
              />
              {errors.dimensions && (
                <p className={styles.formError}>{errors.dimensions.message}</p>
              )}
            </div>
            
            {/* Poids - Nouveau champ */}
            <div className={styles.formGroup}>
              <label htmlFor="weight" className={styles.formLabel}>
                Poids (kg)
              </label>
              <input
                id="weight"
                type="text"
                {...register('weight')}
                className={`${styles.formInput} ${errors.weight ? styles.formInputError : ''}`}
                placeholder="5.2"
              />
              {errors.weight && (
                <p className={styles.formError}>{errors.weight.message}</p>
              )}
            </div>
          </div>
          
          <div className={styles.formGrid}>
            {/* Année */}
            <div className={styles.formGroup}>
              <label htmlFor="year" className={styles.formLabel}>
                Année de création
              </label>
              <input
                id="year"
                type="text"
                {...register('year')}
                className={`${styles.formInput} ${errors.year ? styles.formInputError : ''}`}
                placeholder="2023"
              />
              {errors.year && (
                <p className={styles.formError}>{errors.year.message}</p>
              )}
            </div>
            
            {/* Édition */}
            <div className={styles.formGroup}>
              <label htmlFor="edition" className={styles.formLabel}>
                Édition/Série
              </label>
              <input
                id="edition"
                type="text"
                {...register('edition')}
                className={`${styles.formInput} ${errors.edition ? styles.formInputError : ''}`}
                placeholder="Édition limitée 2/10"
              />
              {errors.edition && (
                <p className={styles.formError}>{errors.edition.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div className={styles.formGroup}>
          <label htmlFor="tags" className={styles.formLabel}>
            Tags (séparés par des virgules)
          </label>
          <input
            id="tags"
            type="text"
            {...register('tags')}
            className={`${styles.formInput} ${errors.tags ? styles.formInputError : ''}`}
            placeholder="abstrait, contemporain, acrylique"
          />
          {errors.tags && (
            <p className={styles.formError}>{errors.tags.message}</p>
          )}
        </div>
        
        {/* Images */}
        <div className={styles.formGroup}>
          <label htmlFor="images" className={styles.formLabel}>
            Images*
          </label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            {...register('images', {
              onChange: handleImageChange,
              shouldUnregister: true
            })}
            ref={(e) => {
              register('images').ref(e)
              fileInputRef.current = e
            }}
            className={`${styles.formFileInput} ${errors.images ? styles.formInputError : ''}`}
          />
          {errors.images && (
            <p className={styles.formError}>{errors.images.message}</p>
          )}
        </div>
        
        {/* Prévisualisation des images */}
        {previewImages.length > 0 && (
          <div className={styles.imagePreviewContainer}>
            {previewImages.map((src, index) => (
              <div key={index} className={styles.imagePreview}>
                <img src={src} alt={`Aperçu ${index + 1}`} />
              </div>
            ))}
          </div>
        )}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => {
              reset()
              setPreviewImages([])
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isSubmitting}
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            {isSubmitting ? 'Création en cours...' : 'Créer l\'œuvre'}
          </button>
        </div>
      </form>
    </div>
  )
}