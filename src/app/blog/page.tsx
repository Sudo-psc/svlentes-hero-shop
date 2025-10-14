import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { getPosts } from '@/lib/wordpress/api'
import { formatDate, estimateReadingTime } from '@/lib/wordpress/transformers'
import { ArticleCard } from '@/components/blog/ArticleCard'

export const metadata: Metadata = {
  title: 'Blog - Dicas e Informações sobre Lentes de Contato | SV Lentes',
  description: 'Artigos, dicas e informações sobre lentes de contato, saúde ocular e cuidados com a visão.',
}

export default async function BlogPage() {
  // Fetch posts from WordPress API
  const posts = await getPosts({ perPage: 6 })

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-cyan-100 text-cyan-800">Conteúdo Especializado</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog SV Lentes</h1>
          <p className="text-xl text-gray-600">Dicas e informações sobre lentes de contato</p>
        </div>

        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {posts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-8">Novos artigos em breve!</p>
          </div>
        )}

        <div className="text-center mt-16">
          <Link
            href="/planos"
            className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Ver Planos de Assinatura
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
