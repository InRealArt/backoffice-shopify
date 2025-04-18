'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Team } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'

interface TeamClientProps {
  teamMembers: Team[]
}

type SortDirection = 'asc' | 'desc'

export default function TeamClient({ teamMembers }: TeamClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingMemberId, setLoadingMemberId] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Vérifier au chargement
    checkIfMobile()
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  const handleMemberClick = (memberId: number) => {
    setLoadingMemberId(memberId)
    router.push(`/landing/team/${memberId}/edit`)
  }

  const handleCreateMember = () => {
    router.push('/landing/team/create')
  }
  
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }
  
  // Trier les membres de l'équipe selon le champ 'order'
  const sortedTeamMembers = [...teamMembers].sort((a, b) => {
    const orderA = a.order ?? 0
    const orderB = b.order ?? 0
    
    if (sortDirection === 'asc') {
      return orderA - orderB
    } else {
      return orderB - orderA
    }
  })
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Équipe</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleCreateMember}
          >
            Ajouter un membre
          </button>
        </div>
        <p className="page-subtitle">
          Liste des membres de l'équipe affichés sur le site
        </p>
      </div>
      
      <div className="page-content">
        {teamMembers.length === 0 ? (
          <div className="empty-state">
            <p>Aucun membre trouvé</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Email</th>
                  <th className="sortable-column" onClick={toggleSortDirection}>
                    <div className="d-flex align-items-center gap-xs">
                      Ordre
                      <span className="sort-icon">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTeamMembers.map((member) => {
                  const isLoading = loadingMemberId === member.id
                  return (
                    <tr 
                      key={member.id} 
                      onClick={() => !loadingMemberId && handleMemberClick(member.id)}
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingMemberId && !isLoading ? 'disabled-row' : ''}`}
                    >
                      <td>{member.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <div className="d-flex align-items-center gap-md">
                            {member.photoUrl1 && (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                                <Image
                                  src={member.photoUrl1}
                                  alt={`${member.firstName} ${member.lastName}`}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <span className={isLoading ? 'text-muted' : ''}>
                              {member.firstName} {member.lastName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{member.role}</td>
                      <td>{member.email}</td>
                      <td>{member.order}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 