'use client'

import { ReactNode } from 'react'

interface StatusRowProps {
  isActive: boolean
  className?: string
  children: ReactNode
  colorType?: 'danger' | 'warning' | 'success' | 'info'
  onClick?: () => void
  isSuccess?: boolean
}

/**
 * Composant pour afficher une ligne de tableau qui change de couleur en fonction d'un statut
 * 
 * @param isActive - Indique si l'élément est actif
 * @param className - Classes CSS additionnelles à appliquer
 * @param colorType - Type de couleur à appliquer (danger, warning, success, info)
 * @param onClick - Fonction à exécuter lors du clic sur la ligne
 * @param isSuccess - Si true, la ligne aura un fond vert (pour indiquer un succès)
 * @param children - Contenu de la ligne
 */
export function StatusRow({ 
  isActive, 
  className = '',
  colorType = 'danger',
  onClick, 
  isSuccess = false,
  children 
}: StatusRowProps) {
  // Déterminer la couleur en fonction du type
  const getBackgroundColor = () => {
    // Si c'est un succès, appliquer un fond vert indépendamment des autres conditions
    if (isSuccess) return 'rgba(72, 187, 120, 0.2)'
    
    // Sinon, appliquer la logique habituelle
    if (isActive) return undefined
    
    switch (colorType) {
      case 'danger':
        return 'rgba(255, 0, 0, 0.1)'
      case 'warning':
        return 'rgba(255, 193, 7, 0.1)'
      case 'success':
        return 'rgba(40, 167, 69, 0.1)'
      case 'info':
        return 'rgba(23, 162, 184, 0.1)'
      default:
        return 'rgba(255, 0, 0, 0.1)'
    }
  }
  
  return (
    <tr 
      className={className}
      onClick={onClick}
      data-status={!isActive ? 'inactive' : 'active'}
      data-success={isSuccess ? 'true' : 'false'}
      style={{ 
        backgroundColor: getBackgroundColor(),
        transition: 'background-color 0.2s ease'
      }}
    >
      {children}
    </tr>
  )
} 