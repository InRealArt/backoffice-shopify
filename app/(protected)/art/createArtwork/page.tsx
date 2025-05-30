'use client'

import { useState, useEffect } from 'react'
import ArtworkForm from '../components/ArtworkForm'
import styles from './createArtwork.module.scss'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'
import { useRouter } from 'next/navigation'

export default function CreateArtworkPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [artistName, setArtistName] = useState('')
  const { user } = useDynamicContext()
  const router = useRouter()
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  useEffect(() => {
    const fetchArtistName = async () => {
      if (user?.email) {
        try {
          const backofficeUser = await getBackofficeUserByEmail(user.email)
          if (backofficeUser) {
            // Utiliser firstName et lastName pour composer le nom complet
            setArtistName(
              `${backofficeUser.artist?.name || ''} ${backofficeUser.artist?.surname || ''}`.trim()
            )
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du nom d\'artiste:', error)
        }
      }
    }
    
    fetchArtistName()
  }, [user])
  
  const handleSuccess = () => {
    router.push('/art/collection')
  }
  
  return (
    <>
      <div className={styles.artworkCreationHeader}>
        <h1>Créer une œuvre dans la Collection de l'artiste <span className={styles.artistHighlight}>{artistName}</span></h1>
        <p className={styles.subtitle}>
          Ajoutez une nouvelle œuvre à votre collection
        </p>
      </div>
      
      <ArtworkForm mode="create" onSuccess={handleSuccess} />
    </>
  )
} 