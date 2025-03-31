'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'
import { useIsAdmin } from '@/app/hooks/useIsAdmin'

interface LandingSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
  isCollapsed?: boolean
}

export default function LandingSubMenu({ isActive, isOpen, toggleSubmenu, onNavigate, isCollapsed = false }: LandingSubMenuProps) {
  const { isAdmin } = useIsAdmin()

  return (
    <>
      <SideMenuItem
        label="Landing Pages"
        isActive={isActive}
        hasSubmenu={true}
        isSubmenuOpen={isOpen}
        onClick={toggleSubmenu}
        isCollapsed={isCollapsed}
      />

      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem
            label="Team"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/team', 'team')}
          />
          <SideMenuItem
            label="Languages"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/languages', 'languages')}
          />
          <SideMenuItem
            label="Translations"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/translations', 'translations')}
          />
          {isAdmin && (
            <SideMenuItem
              label="FAQ"
              isSubmenuItem={true}
              onClick={() => onNavigate('/landing/faq', 'faq')}
            />
          )}
          {isAdmin && (
            <SideMenuItem
              label="Page artistes"
              isSubmenuItem={true}
              onClick={() => onNavigate('/landing/landingArtists', 'landingArtists')}
            />
          )}
        </ul>
      )}

      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem
            label="Team"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/team', 'team')}
          />
          <SideMenuItem
            label="Languages"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/languages', 'languages')}
          />
          <SideMenuItem
            label="Translations"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/translations', 'translations')}
          />
          {isAdmin && (
            <SideMenuItem
              label="FAQ"
              isSubmenuItem={true}
              onClick={() => onNavigate('/landing/faq', 'faq')}
            />
          )}
          {isAdmin && (
            <SideMenuItem
              label="Page artistes"
              isSubmenuItem={true}
              onClick={() => onNavigate('/landing/landingArtists', 'landingArtists')}
            />
          )}
        </ul>
      )}
    </>
  )
} 