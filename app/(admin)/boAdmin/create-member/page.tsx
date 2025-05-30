'use client'

import { useEffect, useState } from 'react'
import CreateMemberForm from './CreateMemberForm'

export default function CreateMemberPage() {
  const [isMobile, setIsMobile] = useState(false)
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
  
  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div className="header-top-section">
            <h1 className="page-title">Créer un utilisateur Backoffice</h1>
          </div>
          <p className="page-subtitle">
            Ajoutez un nouvel utilisateur Backoffice
          </p>
        </div>
        
        <CreateMemberForm />
      </div>
    </>
  )
} 