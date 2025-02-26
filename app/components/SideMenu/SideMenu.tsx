'use client'

import './SideMenu.css'
import SideMenuItem from './SideMenuItem'
import ShopifySubMenu from './ShopifySubMenu'
import { useSideMenuLogic } from './useSideMenuLogic'

export default function SideMenu() {
  const {
    isLoggedIn,
    activeItem,
    canAccessCollection,
    isAdmin,
    showShopifySubmenu,
    handleNavigation,
    toggleShopifySubmenu
  } = useSideMenuLogic()
  
  if (!isLoggedIn) return null

  return (
    <div className="side-menu">
      <ul className="menu-list">
        <SideMenuItem 
          label="Dashboard"
          isActive={activeItem === 'dashboard'}
          onClick={() => handleNavigation('/dashboard', 'dashboard')}
        />
        
        {canAccessCollection && !isAdmin && (
          <>
          <SideMenuItem 
            label="Ma Collection"
            isActive={activeItem === 'collection'}
            onClick={() => handleNavigation('/shopify/collection', 'collection')}
          />
          <SideMenuItem 
            label="Créer une œuvre"
            isActive={activeItem === 'createArtwork'}
            onClick={() => handleNavigation('/shopify/create', 'createArtwork')}
          />
        </>
        )}
        
        {isAdmin && (
          <>
            <ShopifySubMenu
              isActive={activeItem === 'adminShopify'}
              isOpen={showShopifySubmenu}
              toggleSubmenu={toggleShopifySubmenu}
              onNavigate={handleNavigation}
            />
          </>
        )}
      </ul>
    </div>
  )
}