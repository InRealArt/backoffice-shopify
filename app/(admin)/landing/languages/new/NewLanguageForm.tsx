'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLanguage } from '@/lib/actions/language-actions'
import { useToast } from '@/app/components/Toast/ToastContext' 
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').max(5, 'Le code ne doit pas dépasser 5 caractères'),
  isDefault: z.boolean().default(false)
})

type FormValues = z.infer<typeof formSchema>

export default function NewLanguageForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      isDefault: false
    }
  })
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const result = await createLanguage(data)
      
      if (result.success) {
        success('Langue créée avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/landing/languages')
          router.refresh()
        }, 1000)
      } else {
        error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      error('Une erreur est survenue lors de la création')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/landing/languages')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Nouvelle langue</h1>
        </div>
        <p className="page-subtitle">
          Créer une nouvelle langue pour le contenu multilingue
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Nom de la langue</label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="Ex: Français, English, Español..."
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            <div className="form-group mt-4">
              <label htmlFor="code" className="form-label">Code de la langue</label>
              <input
                id="code"
                type="text"
                {...register('code')}
                className={`form-input ${errors.code ? 'input-error' : ''}`}
                placeholder="Ex: fr, en, es..."
              />
              {errors.code && (
                <p className="form-error">{errors.code.message}</p>
              )}
              <p className="form-help">
                Code ISO de la langue (2-5 caractères)
              </p>
            </div>

            <div className="form-group mt-4">
              <div className="form-checkbox">
                <input
                  id="isDefault"
                  type="checkbox"
                  {...register('isDefault')}
                  className="form-checkbox-input"
                />
                {/* <label htmlFor="isDefault" className="form-checkbox-label">
                  Définir comme langue par défaut
                </label> */}
              </div>
              <p className="form-help">
                Si cette option est cochée, cette langue sera utilisée comme langue par défaut et remplacera toute autre langue par défaut existante.
              </p>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="btn btn-secondary btn-medium"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn btn-primary btn-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création en cours...' : 'Créer la langue'}
          </button>
        </div>
      </form>
    </div>
  )
} 