'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import { SmartContract } from '@prisma/client'
import { truncateAddress } from '@/lib/blockchain/utils'
import { Filters, FilterItem } from '@/app/components/Common'
import { StatusRow } from '@/app/components/Table'

// Types pour les relations imbriquées
type NftCollection = {
  id: number
  name: string
  symbol: string
  smartContract: SmartContract | null
  contractAddress?: string
}

type NftResource = {
  id: number
  name: string
  tokenId?: number
  collection: NftCollection
}

type RoyaltyBeneficiaryWithRelations = {
  id: number
  wallet: string
  percentage: number
  totalPercentage: number
  txHash?: string
  nftResourceId: number
  nftResource?: NftResource
}

interface RoyaltyBeneficiariesClientProps {
  royaltyBeneficiaries: RoyaltyBeneficiaryWithRelations[]
  smartContracts: SmartContract[]
}

export default function RoyaltyBeneficiariesClient({ 
  royaltyBeneficiaries = [], 
  smartContracts = [] 
}: RoyaltyBeneficiariesClientProps) {
  // Debug: afficher exactement ce qui est reçu
  console.log('Type de royaltyBeneficiaries:', typeof royaltyBeneficiaries, Array.isArray(royaltyBeneficiaries))
  console.log('Longueur:', royaltyBeneficiaries?.length)
  console.log('Premier élément:', royaltyBeneficiaries?.[0])

  const [isMobile, setIsMobile] = useState(false)
  const [selectedSmartContractId, setSelectedSmartContractId] = useState<number | null>(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null)
  
  // Détection du mode mobile
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
  
  // Obtenir toutes les collections uniques
  const collections = Array.isArray(royaltyBeneficiaries)
    ? royaltyBeneficiaries
        .filter(b => b?.nftResource?.collection)
        .map(b => b.nftResource!.collection)
        .filter((collection, index, self) => 
          index === self.findIndex(c => c.id === collection.id)
        )
    : []
  
  // Filtrage des bénéficiaries avec tous les filtres
  const filteredBeneficiaries = (Array.isArray(royaltyBeneficiaries) ? royaltyBeneficiaries : [])
    .filter(beneficiary => {
      // Filtre par smart contract
      if (selectedSmartContractId && 
          beneficiary?.nftResource?.collection?.smartContract?.id !== selectedSmartContractId) {
        return false
      }
      
      // Filtre par collection NFT
      if (selectedCollectionId && 
          beneficiary?.nftResource?.collection?.id !== selectedCollectionId) {
        return false
      }
      
      return true
    })
  
  console.log('Bénéficiaires filtrés:', filteredBeneficiaries?.length, filteredBeneficiaries?.[0])
  
  // Obtenir le smart contract associé à un bénéficiaire
  const getSmartContract = (beneficiary: RoyaltyBeneficiaryWithRelations) => {
    return beneficiary?.nftResource?.collection?.smartContract
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Bénéficiaires de Royalties</h1>
        </div>
        <p className="page-subtitle">
          Gérez les bénéficiaires de royalties dans le système
        </p>
      </div>
      
      <Filters>
        <FilterItem
          id="smartContractFilter"
          label="Filtrer par smart contract:"
          value={selectedSmartContractId ? selectedSmartContractId.toString() : ''}
          onChange={(value) => setSelectedSmartContractId(value ? parseInt(value) : null)}
          options={[
            { value: '', label: 'Tous les smart contracts' },
            ...smartContracts.map(smartContract => ({
              value: smartContract.id.toString(),
              label: `${smartContract.active ? '🟢 ' : '🔴 '} ${formatChainName(smartContract.network)} - ${truncateAddress(smartContract.factoryAddress)}`
            }))
          ]}
        />
        <FilterItem
          id="collectionFilter"
          label="Filtrer par collection:"
          value={selectedCollectionId ? selectedCollectionId.toString() : ''}
          onChange={(value) => setSelectedCollectionId(value ? parseInt(value) : null)}
          options={[
            { value: '', label: 'Toutes les collections' },
            ...collections.map(collection => ({
              value: collection.id.toString(),
              label: collection.name || `Collection #${collection.id}`
            }))
          ]}
        />
      </Filters>
      
      <div className="page-content">
        {!Array.isArray(filteredBeneficiaries) || filteredBeneficiaries.length === 0 ? (
          <div className="empty-state">
            <p>Aucun bénéficiaire de royalties trouvé.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Bénéficiaire</th>
                  <th>Part (%)</th>
                  <th>% total du prix du NFT</th>
                  <th className="hidden-mobile">Transaction Hash</th>
                  <th className="hidden-mobile">NFT Resource</th>
                  <th className="hidden-mobile">Token ID</th>
                  <th>Nom Collection</th>
                  <th className="hidden-mobile">Collection</th>
                  <th className="hidden-mobile">Factory Address</th>
                  <th className="hidden-mobile">Réseau</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map((beneficiary) => {
                  const smartContract = getSmartContract(beneficiary)
                  const isActive = smartContract?.active ?? true;
                  
                  return (
                    <StatusRow 
                      key={beneficiary?.id} 
                      className="table-row"
                      isActive={isActive}
                      colorType="danger"
                    >
                      <td>{beneficiary?.id}</td>
                      <td>
                        <BlockchainAddress 
                          address={beneficiary?.wallet} 
                          network={smartContract?.network || 'sepolia'} 
                        />
                      </td>
                      <td>{beneficiary?.percentage}%</td>
                      <td>{beneficiary?.totalPercentage}%</td>
                      <td className="hidden-mobile">
                        {beneficiary?.txHash ? (
                          <BlockchainAddress 
                            address={beneficiary.txHash} 
                            network={smartContract?.network || 'sepolia'} 
                            isTransaction={true}
                            showExplorerLink={true}
                          />
                        ) : (
                          <span className="text-muted fst-italic">Non défini</span>
                        )}
                      </td>
                      <td className="hidden-mobile">
                        {beneficiary?.nftResource?.name || 'Non défini'}
                      </td>
                      <td className="hidden-mobile">
                        {beneficiary?.nftResource?.tokenId || 'Non défini'}
                      </td>
                      <td>
                        {beneficiary?.nftResource?.collection?.name || 'Non défini'}
                      </td>
                      <td className="hidden-mobile">
                        {beneficiary?.nftResource?.collection?.contractAddress ? (
                          <BlockchainAddress 
                            address={beneficiary.nftResource.collection.contractAddress} 
                            network={smartContract?.network || 'sepolia'} 
                            showExplorerLink={true}
                          />
                        ) : (
                          <span className="text-muted fst-italic">Non déployée</span>
                        )}
                      </td>
                      <td className="hidden-mobile">
                        {smartContract ? (
                          <div className="d-flex align-items-center gap-sm">
                            <BlockchainAddress 
                              address={smartContract.factoryAddress} 
                              network={smartContract.network} 
                              showExplorerLink={true}
                            />
                            <span className={`badge ${smartContract.active ? 'badge-success' : 'badge-danger'}`}>
                              {smartContract.active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">Aucun</span>
                        )}
                      </td>
                      <td className="hidden-mobile">
                        {smartContract ? (
                          <span className="info-badge">
                            {formatChainName(smartContract.network)}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </StatusRow>
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