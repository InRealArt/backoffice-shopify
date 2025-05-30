'use client'

import React, { useState, useCallback, useRef, useEffect, memo } from 'react'
import { Code, ClipboardCheck, UserCheck, BarChart2 } from 'lucide-react'
import Modal from '../Common/Modal'
import SEOContentGenerator, { ArticleContent } from './SEOContentGenerator'
import styles from './SEOModal.module.scss'

// Fonction utilitaire pour formater le HTML avec indentation
const formatHTMLWithIndent = (html: string): string => {
  if (!html) return ''
  
  // Trimmer le HTML avant de commencer
  const trimmedHtml = html.trim()
  if (!trimmedHtml) return ''
  
  let formatted = ''
  let indent = 0
  
  // Remplacer tous les retours à la ligne et espaces multiples par un seul espace
  // Mais préserver les espaces significatifs dans le contenu textuel
  const tmp = trimmedHtml.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ')
  
  // Liste des balises qui augmentent l'indentation
  const indentationTags = ['article', 'header', 'div', 'p', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'article', 'section', 'header', 'footer', 'main', 'aside', 'nav', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'figure', 'figcaption']
  
  // Regex pour capturer les balises
  const tagRegex = /<\/?([a-z0-9]+)(?:\s+[^>]*)?\s*>/gi
  
  let lastIndex = 0
  let match
  
  while ((match = tagRegex.exec(tmp)) !== null) {
    const tag = match[1].toLowerCase()
    const isClosingTag = match[0].startsWith('</')
    const isAutoClosingTag = match[0].endsWith('/>')
    
    // Ajouter le texte avant la balise
    const beforeTag = tmp.substring(lastIndex, match.index).trim()
    if (beforeTag) {
      formatted += '\n' + ' '.repeat(indent * 2) + beforeTag
    }
    
    // Ajuster l'indentation pour les balises de bloc
    if (indentationTags.includes(tag)) {
      // Placer les balises de fermeture avec une indentation correcte
      if (isClosingTag) {
        indent = Math.max(0, indent - 1)
      }
      
      // Ajouter la balise avec l'indentation appropriée
      formatted += '\n' + ' '.repeat(indent * 2) + match[0]
      
      // Augmenter l'indentation après l'ouverture d'une balise
      if (!isClosingTag && !isAutoClosingTag) {
        indent++
      }
    } else {
      // Ajouter les autres balises sans modifier l'indentation
      formatted += match[0]
    }
    
    lastIndex = match.index + match[0].length
  }
  
  // Ajouter le reste du texte
  if (lastIndex < tmp.length) {
    const restOfHtml = tmp.substring(lastIndex).trim()
    if (restOfHtml) {
      formatted += '\n' + ' '.repeat(indent * 2) + restOfHtml
    }
  }
  
  // S'assurer que le résultat final est bien trimmé
  return formatted.trim()
}

interface SEOModalGeneratorProps {
  onContentGenerated: (html: string) => void
  initialData?: Partial<ArticleContent>
}

// Rendu memoïsé du contenu d'aperçu pour éviter les rendus inutiles
const PreviewContent = memo(function PreviewContent({ html }: { html: string }) {
  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
});
PreviewContent.displayName = 'PreviewContent';

export default function SEOModalGenerator({ 
  onContentGenerated, 
  initialData = {} 
}: SEOModalGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [currentWordCount, setCurrentWordCount] = useState(0)
  
  // Référence pour le timer d'animation de copie
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)
  
  const handleContentChange = useCallback((html: string, wordCount?: number) => {
    // Mise à jour du HTML
    if (html.trim() !== generatedHtml.trim()) {
      // Formater le HTML pour une meilleure lisibilité
      const formattedHtml = html.trim()
      
      // S'assurer que le HTML généré est à jour immédiatement
      setGeneratedHtml(formattedHtml)
      
      // Mettre à jour le callback parent si fourni
      // Nous l'appelons seulement si le HTML a significativement changé
      // pour éviter les boucles de rendu infinies
      if (onContentGenerated && Math.abs(formattedHtml.length - generatedHtml.length) > 2) {
        onContentGenerated(formattedHtml)
      }
    }
    
    // Mise à jour du compteur de mots
    if (wordCount !== undefined) {
      setCurrentWordCount(wordCount)
    }
  }, [generatedHtml, onContentGenerated])
  
  const handleCopyHtml = useCallback(() => {
    // S'assurer que le HTML est propre avant de le formater
    const trimmedHtml = generatedHtml.trim()
    
    // Formater le HTML avant de le copier
    navigator.clipboard.writeText(trimmedHtml)
      .then(() => {
        setIsCopied(true)
        
        // Annuler le timer précédent si existant
        if (copyTimerRef.current) {
          clearTimeout(copyTimerRef.current)
        }
        
        // Réinitialiser après 2 secondes
        copyTimerRef.current = setTimeout(() => {
          setIsCopied(false)
          copyTimerRef.current = null
        }, 2000)
        
        // Si un callback est fourni, l'appeler avec le HTML
        if (onContentGenerated) {
          onContentGenerated(trimmedHtml)
        }
      })
      .catch(err => console.error('Erreur lors de la copie: ', err))
  }, [generatedHtml, onContentGenerated])
  
  // Gérer le changement d'onglet en forçant une mise à jour du HTML si nécessaire
  const handleTabChange = (tab: string) => {
    // Si on passe à l'onglet Aperçu ou HTML, s'assurer que le contenu est à jour
    if (tab === 'preview' || tab === 'html') {
      // Forcer une mise à jour du DOM dans le prochain cycle
      setTimeout(() => {
        const currentDOM = document.querySelector(`.${styles.tabContent}[style*="block"] .prose`);
        if (currentDOM) {
          // Déclencher un reflow du DOM pour forcer la mise à jour du contenu
          currentDOM.classList.add('refresh-content');
          setTimeout(() => currentDOM.classList.remove('refresh-content'), 10);
        }
      }, 10);
    }
    setActiveTab(tab);
  };
  
  // Forcer la mise à jour du contenu aperçu lorsque l'onglet change
  useEffect(() => {
    if (activeTab === 'preview' || activeTab === 'html') {
      // Forcer un refresh du contenu HTML (si nécessaire)
      if (generatedHtml) {
        const refreshTimer = setTimeout(() => {
          setGeneratedHtml(html => html + ' ');
          setTimeout(() => setGeneratedHtml(html => html.trim()), 10);
        }, 10);
        return () => clearTimeout(refreshTimer);
      }
    }
  }, [activeTab]);
  
  // Debugging pour les mots-clés
  useEffect(() => {
    console.log('SEOModalGenerator - initialData:', initialData);
    
    // Vérification approfondie des tags
    if (initialData?.tags) {
      console.log('Type des tags:', typeof initialData.tags);
      console.log('Est un Array?', Array.isArray(initialData.tags));
      console.log('Longueur brute:', initialData.tags.length);
      
      if (Array.isArray(initialData.tags)) {
        console.log('Contenu du tableau tags:');
        initialData.tags.forEach((tag, index) => {
          console.log(`[${index}] Type: ${typeof tag}, Valeur: "${tag}", Vide?: ${!tag}`);
        });
        
        const validTags = initialData.tags.filter(Boolean).map(tag => typeof tag === 'string' ? tag.trim() : tag).filter(tag => tag && String(tag).length > 0);
        console.log('Tags valides après filtrage:', validTags);
        console.log('Nombre de tags valides:', validTags.length);
      }
    } else {
      console.log('Aucun tag trouvé dans initialData');
    }
  }, [initialData]);
  
  return (
    <>
      <button 
        onClick={handleOpen}
        type="button"
        className="btn btn-primary flex items-center gap-2 btn-medium"
      >
        <Code size={20} />
        Assistant SEO
      </button>
      
      <Modal 
        isOpen={isOpen}
        onClose={handleClose}
        title="Générateur de contenu SEO"
      >
        <div className={styles.seoModalContainer}>
          <div className={styles.tabsList}>
            <button
              className={`${styles.tabTrigger} ${activeTab === 'editor' ? styles.active : ''}`} 
              onClick={() => handleTabChange('editor')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Éditeur SEO
            </button>
            <button
              className={`${styles.tabTrigger} ${activeTab === 'preview' ? styles.active : ''}`} 
              onClick={() => handleTabChange('preview')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Aperçu
            </button>
            <button
              className={`${styles.tabTrigger} ${activeTab === 'html' ? styles.active : ''}`} 
              onClick={() => handleTabChange('html')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              HTML
            </button>
            <button
              className={`${styles.tabTrigger} ${activeTab === 'analyzer' ? styles.active : ''}`} 
              onClick={() => handleTabChange('analyzer')}
            >
              <BarChart2 size={16} className="mr-2" />
              Analyse SEO
            </button>
          </div>
          
          <div className={styles.contentWrapper}>
            <div className={styles.tabContent} style={{ display: activeTab === 'editor' ? 'block' : 'none' }}>
              <SEOContentGenerator 
                value={generatedHtml}
                onChange={handleContentChange}
                initialData={initialData}
                hideControls={true}
              />
            </div>
            
            <div className={styles.tabContent} style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
              <div className="p-6 border rounded-lg shadow-sm bg-white overflow-auto" style={{ minHeight: '400px' }}>
                <PreviewContent html={generatedHtml} />
              </div>
            </div>
            
            <div className={styles.tabContent} style={{ display: activeTab === 'html' ? 'block' : 'none' }}>
              {generatedHtml ? (
                <div className="bg-gray-50 rounded-lg p-4 border shadow-sm" style={{ minHeight: '400px' }}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Code HTML formaté</h3>
                    <button 
                      onClick={() => {
                        const htmlContent = generatedHtml.trim();
                        navigator.clipboard.writeText(htmlContent);
                        
                        // Appliquer le contenu au textarea via le callback
                        if (onContentGenerated) {
                          onContentGenerated(htmlContent);
                        }
                        
                        // Afficher une notification visuelle de copie réussie
                        const button = document.activeElement;
                        if (button && button instanceof HTMLElement) {
                          const originalText = button.textContent;
                          button.textContent = 'Copié ✓';
                          button.classList.add('bg-green-200', 'text-green-800');
                          
                          setTimeout(() => {
                            button.textContent = originalText;
                            button.classList.remove('bg-green-200', 'text-green-800');
                          }, 2000);
                        }
                      }}
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      Copier
                    </button>
                  </div>
                  <pre className="whitespace-pre text-sm font-mono overflow-auto max-h-[500px] p-4 bg-white border rounded text-gray-800" style={{ lineHeight: 1.5 }}>
                    {formatHTMLWithIndent(generatedHtml.trim())}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                  <p className="mt-4 text-center">
                    Créez du contenu dans l'onglet Éditeur pour visualiser le code HTML ici
                  </p>
                </div>
              )}
            </div>
            
            <div className={styles.tabContent} style={{ display: activeTab === 'analyzer' ? 'block' : 'none' }}>
              <div className="p-6 border rounded-lg shadow-sm bg-white overflow-auto" style={{ minHeight: '400px' }}>
                <h3 className="text-lg font-semibold mb-3">Score SEO : {currentWordCount < 300 ? 40 : currentWordCount < 600 ? 70 : 90}%</h3>
                <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                  <div 
                    className={`h-2 rounded-full ${
                      currentWordCount < 300 ? 'bg-red-500' : 
                      currentWordCount < 600 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${currentWordCount < 300 ? 40 : currentWordCount < 600 ? 70 : 90}%` }}
                  ></div>
                </div>
                
                <div className="grid gap-2">
                  <div className={`flex items-center ${generatedHtml && /<h1[^>]*>[^<\s]+.*?<\/h1>/i.test(generatedHtml) ? styles.itemSuccess : styles.itemError}`}>
                    <span className="mr-2">{generatedHtml && /<h1[^>]*>[^<\s]+.*?<\/h1>/i.test(generatedHtml) ? <span className={styles.textSuccess}>✓</span> : <span className={styles.textError}>×</span>}</span>
                    <span>Titre principal</span>
                  </div>
                  
                  <div className={`flex items-center ${currentWordCount >= 300 ? styles.itemSuccess : styles.itemError}`}>
                    <span className="mr-2">{currentWordCount >= 300 ? <span className={styles.textSuccess}>✓</span> : <span className={styles.textError}>×</span>}</span>
                    <span>Longueur du contenu principal ({currentWordCount} mots, min. 300)</span>
                  </div>
                  
                  <div className={`flex items-center ${generatedHtml.includes('<h2') || generatedHtml.includes('<h3') ? styles.itemSuccess : styles.itemError}`}>
                    <span className="mr-2">{generatedHtml.includes('<h2') || generatedHtml.includes('<h3') ? <span className={styles.textSuccess}>✓</span> : <span className={styles.textError}>×</span>}</span>
                    <span>Structure des titres (H2, H3)</span>
                  </div>
                  
                  {(() => {
                    // Vérification robuste des tags
                    const hasTags = initialData?.tags !== undefined;
                    
                    // Conversion des tags en tableau si ce n'est pas déjà le cas
                    let tagArray: any[] = [];
                    if (hasTags) {
                      if (Array.isArray(initialData?.tags)) {
                        tagArray = initialData.tags;
                      } else if (typeof initialData?.tags === 'string') {
                        // Si c'est une chaîne JSON, essayer de la parser
                        try {
                          const parsed = JSON.parse(initialData.tags);
                          tagArray = Array.isArray(parsed) ? parsed : [parsed];
                        } catch (e) {
                          // Si ce n'est pas du JSON valide, c'est soit un simple tag ou une liste séparée par des virgules
                          const tagsStr = String(initialData.tags);
                          // Vérifions si c'est une liste séparée par des virgules
                          if (tagsStr.includes(',')) {
                            tagArray = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
                          } else {
                            tagArray = [tagsStr];
                          }
                        }
                      } else {
                        // Autre type, convertir en tableau
                        tagArray = [initialData?.tags].filter(Boolean);
                      }
                    }
                    
                    // Filtrer pour n'avoir que des tags valides
                    const validTags = tagArray
                      .filter(Boolean)
                      .map(tag => typeof tag === 'string' ? tag.trim() : String(tag))
                      .filter(tag => tag && tag.length > 0);
                    
                    const hasEnoughTags = validTags.length >= 2;
                    
                    console.log('Calcul final - tagArray:', tagArray);
                    console.log('Calcul final - validTags:', validTags);
                    console.log('Calcul final - hasEnoughTags:', hasEnoughTags);
                    
                    return (
                      <div className={`flex items-center ${hasEnoughTags ? styles.itemSuccess : styles.itemError}`}>
                        <span className="mr-2">{hasEnoughTags ? <span className={styles.textSuccess}>✓</span> : <span className={styles.textError}>×</span>}</span>
                        <span>Présence des mots-clés ({validTags.length}/2 minimum)</span>
                      </div>
                    );
                  })()}
                  
                  <div className={`flex items-center ${generatedHtml.includes('<a href') && (generatedHtml.match(/<a [^>]*href/gi) || []).length >= 2 ? styles.itemSuccess : styles.itemError}`}>
                    <span className="mr-2">{generatedHtml.includes('<a href') && (generatedHtml.match(/<a [^>]*href/gi) || []).length >= 2 ? <span className={styles.textSuccess}>✓</span> : <span className={styles.textError}>×</span>}</span>
                    <span>Liens (au moins 2 liens recommandés)</span>
                  </div>
                  
                  <div className={`flex items-center ${generatedHtml.includes('<img ') ? styles.itemSuccess : styles.itemError}`}>
                    <span className="mr-2">{generatedHtml.includes('<img ') ? <span className={styles.textSuccess}>✓</span> : <span className={styles.textError}>×</span>}</span>
                    <span>Images avec texte alternatif</span>
                  </div>
                </div>
                
                <div className="mt-4 text-sm bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="font-semibold mb-1">Schema Markup généré :</div>
                  <div className="text-xs overflow-x-auto">
                    <pre>
                      {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": initialData?.title || "Titre de l'article",
                        "image": initialData?.mainImage?.url || "",
                        "keywords": initialData?.tags?.join(', ') || "",
                        "wordCount": currentWordCount,
                        "datePublished": new Date().toISOString().split('T')[0],
                        "dateModified": new Date().toISOString().split('T')[0],
                        "author": {
                          "@type": "Person",
                          "name": "Auteur"
                        }
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {/* Conseils SEO */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-blue-800 mb-2">Conseils SEO :</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    <li>Ajoutez au moins 2 sous-titres (H2, H3) pour structurer votre contenu</li>
                    <li>Incluez au moins 2 liens internes ou externes pour améliorer le référencement</li>
                    <li>Utilisez vos mots-clés dans le premier paragraphe pour le positionnement</li>
                    <li>Visez au moins 300 mots pour le contenu complet (idéalement 600+)</li>
                    <li>Assurez-vous que toutes les images ont un texte alternatif descriptif</li>
                    <li>Incluez vos mots-clés dans les titres et sous-titres</li>
                    <li>Rédigez un meta description entre 120 et 160 caractères incluant vos mots-clés</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.actionButtons}>
            <div className={styles.statusIndicator}>
              <span>Nombre de mots: </span>
              <span className={styles.wordCount}>{currentWordCount}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                currentWordCount < 300 
                  ? 'bg-red-100 text-red-800' 
                  : currentWordCount < 600 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
              }`}>
                {currentWordCount < 300 
                  ? 'Trop court' 
                  : currentWordCount < 600 
                    ? 'Acceptable' 
                    : 'Bon'}
              </span>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleClose}
                type="button"
                className="btn btn-secondary"
              >
                Fermer
              </button>
              
              <button 
                onClick={handleCopyHtml}
                type="button"
                className="btn btn-primary flex items-center gap-2"
                disabled={!generatedHtml || isCopied}
              >
                {isCopied ? (
                  <>
                    <ClipboardCheck size={16} /> 
                    Copié !
                  </>
                ) : (
                  <>
                    <Code size={16} /> 
                    Copier le HTML
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
} 