import { prisma } from '@/lib/prisma'
import CollectionsClient from './CollectionsClient'


export const metadata = {
  title: 'Liste des collections | Blockchain',
  description: 'Gérez les collections enregistrées dans le système',
}

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: {
      symbol: 'asc',
    },
    include: {
      artist: true,
      factory: true,
    },
  })

  const factories = await prisma.factory.findMany({
    orderBy: {
      id: 'asc',
    },
  })

  return <CollectionsClient collections={collections} factories={factories} />
} 