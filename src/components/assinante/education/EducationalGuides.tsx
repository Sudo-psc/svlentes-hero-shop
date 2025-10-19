'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Play,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Video,
  FileText,
  HelpCircle,
  ChevronRight,
  Star,
  Users,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Guide {
  id: string
  title: string
  description: string
  category: 'hygiene' | 'usage' | 'symptoms' | 'emergency' | 'maintenance'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string // em minutos
  type: 'video' | 'article' | 'checklist' | 'quiz'
  thumbnail?: string
  videoUrl?: string
  content?: string
  isCompleted?: boolean
  isBookmarked?: boolean
  rating?: number
  views?: number
  tags: string[]
  author: {
    name: string
    title: string
    avatar?: string
  }
}

const mockGuides: Guide[] = [
  {
    id: '1',
    title: 'Como Colocar e Retirar Lentes de Contato',
    description: 'Aprenda passo a passo como colocar e retirar suas lentes de contato de forma segura e higiênica.',
    category: 'usage',
    difficulty: 'beginner',
    duration: '5 min',
    type: 'video',
    videoUrl: 'https://example.com/video1',
    isCompleted: true,
    rating: 4.8,
    views: 2340,
    tags: ['básico', 'higiene', 'primeiros passos'],
    author: {
      name: 'Dra. Paula Costa',
      title: 'Oftalmologista'
    }
  },
  {
    id: '2',
    title: 'Higiene das Lentes de Contato: Guia Completo',
    description: 'Todos os cuidados necessários para manter suas lentes limpas e seguras.',
    category: 'hygiene',
    difficulty: 'intermediate',
    duration: '8 min',
    type: 'article',
    isCompleted: false,
    isBookmarked: true,
    rating: 4.9,
    views: 1856,
    tags: ['higiene', 'soluções', 'conservação'],
    author: {
      name: 'Dr. Philipe Saraiva Cruz',
      title: 'Oftalmologista - CRM-MG 69.870'
    }
  },
  {
    id: '3',
    title: 'Sintomas de Emergência Ocular',
    description: 'Identifique quando procurar ajuda médica imediatamente ao usar lentes de contato.',
    category: 'emergency',
    difficulty: 'beginner',
    duration: '3 min',
    type: 'checklist',
    isCompleted: false,
    rating: 5.0,
    views: 3421,
    tags: ['emergência', 'segurança', 'sintomas'],
    author: {
      name: 'Dr. Philipe Saraiva Cruz',
      title: 'Oftalmologista - CRM-MG 69.870'
    }
  },
  {
    id: '4',
    title: 'Manutenção Diária das Lentes',
    description: 'Checklist diário para cuidados essenciais com suas lentes de contato.',
    category: 'maintenance',
    difficulty: 'beginner',
    duration: '4 min',
    type: 'checklist',
    isCompleted: true,
    rating: 4.7,
    views: 1567,
    tags: ['rotina', 'checklist', 'cuidados diários'],
    author: {
      name: 'Dra. Paula Costa',
      title: 'Oftalmologista'
    }
  },
  {
    id: '5',
    title: 'Quiz: Teste seus Conhecimentos sobre Lentes',
    description: 'Teste seus conhecimentos sobre o uso seguro de lentes de contato.',
    category: 'symptoms',
    difficulty: 'intermediate',
    duration: '10 min',
    type: 'quiz',
    isCompleted: false,
    rating: 4.6,
    views: 892,
    tags: ['quiz', 'aprendizado', 'validação'],
    author: {
      name: 'Equipe SVLentes',
      title: 'Especialistas em Lentes'
    }
  },
  {
    id: '6',
    title: 'Como Lidar com Olhos Secos',
    description: 'Estratégias e produtos para aliviar o desconforto de olhos secos ao usar lentes.',
    category: 'symptoms',
    difficulty: 'intermediate',
    duration: '6 min',
    type: 'article',
    isCompleted: false,
    rating: 4.5,
    views: 1203,
    tags: ['conforto', 'olhos secos', 'soluções'],
    author: {
      name: 'Dra. Paula Costa',
      title: 'Oftalmologista'
    }
  }
]

interface EducationalGuidesProps {
  category?: Guide['category']
  limit?: number
  showFilters?: boolean
}

export function EducationalGuides({ category, limit, showFilters = true }: EducationalGuidesProps) {
  const [guides] = useState<Guide[]>(mockGuides)
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)

  const categories = [
    { value: 'all', label: 'Todos', icon: BookOpen },
    { value: 'hygiene', label: 'Higiene', icon: Award },
    { value: 'usage', label: 'Uso', icon: Play },
    { value: 'symptoms', label: 'Sintomas', icon: HelpCircle },
    { value: 'emergency', label: 'Emergência', icon: AlertTriangle },
    { value: 'maintenance', label: 'Manutenção', icon: CheckCircle }
  ]

  const difficulties = [
    { value: 'all', label: 'Todos os níveis' },
    { value: 'beginner', label: 'Iniciante' },
    { value: 'intermediate', label: 'Intermediário' },
    { value: 'advanced', label: 'Avançado' }
  ]

  const types = [
    { value: 'all', label: 'Todos os tipos' },
    { value: 'video', label: 'Vídeo' },
    { value: 'article', label: 'Artigo' },
    { value: 'checklist', label: 'Checklist' },
    { value: 'quiz', label: 'Quiz' }
  ]

  const filteredGuides = guides.filter(guide => {
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || guide.difficulty === selectedDifficulty
    const matchesType = selectedType === 'all' || guide.type === selectedType
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesDifficulty && matchesType && matchesSearch
  }).slice(0, limit)

  const getCategoryColor = (category: Guide['category']) => {
    switch (category) {
      case 'hygiene': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'usage': return 'bg-green-100 text-green-800 border-green-200'
      case 'symptoms': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: Guide['type']) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'article': return <FileText className="h-4 w-4" />
      case 'checklist': return <CheckCircle className="h-4 w-4" />
      case 'quiz': return <HelpCircle className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: Guide['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50'
      case 'intermediate': return 'text-yellow-600 bg-yellow-50'
      case 'advanced': return 'text-red-600 bg-red-50'
    }
  }

  const handleViewGuide = (guide: Guide) => {
    setSelectedGuide(guide)
  }

  const handleBookmark = (guideId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Bookmark guide:', guideId)
  }

  const handleComplete = (guideId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Mark guide as complete:', guideId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Guias Educativos</h2>
        <p className="text-muted-foreground mt-2">
          Aprenda tudo sobre cuidados com lentes de contato com nossos guias especializados
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{guides.length}</div>
          <div className="text-sm text-gray-600">Guias Disponíveis</div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {guides.filter(g => g.isCompleted).length}
          </div>
          <div className="text-sm text-gray-600">Concluídos</div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {guides.filter(g => g.isBookmarked).length}
          </div>
          <div className="text-sm text-gray-600">Salvos</div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(guides.reduce((acc, g) => acc + (g.views || 0), 0) / 1000)}K
          </div>
          <div className="text-sm text-gray-600">Visualizações</div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-card border rounded-lg p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dificuldade</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <input
                type="text"
                placeholder="Buscar guias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Grid de Guias */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGuides.map((guide, index) => (
          <motion.div
            key={guide.id}
            className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleViewGuide(guide)}
          >
            {/* Thumbnail */}
            <div className="relative h-40 bg-gradient-to-br from-cyan-50 to-blue-50">
              {guide.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 rounded-full p-3">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}

              <div className="absolute top-2 left-2">
                <Badge className={cn("text-xs", getCategoryColor(guide.category))}>
                  {categories.find(c => c.value === guide.category)?.label}
                </Badge>
              </div>

              <div className="absolute top-2 right-2">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 bg-white bg-opacity-80 hover:bg-opacity-100"
                    onClick={(e) => handleBookmark(guide.id, e)}
                  >
                    <Star className={cn("h-3 w-3", guide.isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-gray-400")} />
                  </Button>
                </div>
              </div>

              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-white bg-opacity-90 rounded px-2 py-1">
                    {getTypeIcon(guide.type)}
                    <span className="text-xs">{guide.duration}</span>
                  </div>
                  {guide.isCompleted && (
                    <CheckCircle className="h-4 w-4 text-green-600 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">{guide.title}</h3>
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{guide.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {guide.tags.slice(0, 3).map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {guide.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{guide.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Autor e Avaliação */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{guide.author.name.split(' ').pop()}</span>
                </div>

                {guide.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{guide.rating}</span>
                  </div>
                )}
              </div>

              {/* Barra de Progresso */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {guide.isCompleted ? 'Concluído' : 'Não iniciado'}
                  </span>
                  <span className={cn("px-2 py-1 rounded text-xs", getDifficultyColor(guide.difficulty))}>
                    {guide.difficulty === 'beginner' && 'Iniciante'}
                    {guide.difficulty === 'intermediate' && 'Intermediário'}
                    {guide.difficulty === 'advanced' && 'Avançado'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum guia encontrado para os filtros selecionados</p>
        </div>
      )}

      {/* Modal de Detalhes do Guia */}
      <AnimatePresence>
        {selectedGuide && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedGuide(null)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative h-48 bg-gradient-to-br from-cyan-50 to-blue-50">
                {selectedGuide.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="bg-black bg-opacity-50 hover:bg-opacity-70"
                      onClick={() => window.open(selectedGuide.videoUrl, '_blank')}
                    >
                      <Play className="h-6 w-6 mr-2" />
                      Assistir Vídeo
                    </Button>
                  </div>
                )}

                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <Badge className={cn("text-xs", getCategoryColor(selectedGuide.category))}>
                    {categories.find(c => c.value === selectedGuide.category)?.label}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white bg-opacity-80 hover:bg-opacity-100"
                    onClick={() => setSelectedGuide(null)}
                  >
                    ×
                  </Button>
                </div>

                <div className="absolute bottom-4 left-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedGuide.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {getTypeIcon(selectedGuide.type)}
                      <span>{selectedGuide.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{selectedGuide.views} visualizações</span>
                    </div>
                    {selectedGuide.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{selectedGuide.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-cyan-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-cyan-800">
                        {selectedGuide.author.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedGuide.author.name}</p>
                      <p className="text-sm text-gray-600">{selectedGuide.author.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleBookmark(selectedGuide.id, e)}
                    >
                      <Star className={cn("h-4 w-4 mr-1", selectedGuide.isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-gray-400")} />
                      {selectedGuide.isBookmarked ? 'Salvo' : 'Salvar'}
                    </Button>

                    {!selectedGuide.isCompleted && (
                      <Button
                        size="sm"
                        onClick={(e) => handleComplete(selectedGuide.id, e)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar como Concluído
                      </Button>
                    )}

                    {selectedGuide.type === 'article' && (
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{selectedGuide.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedGuide.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Conteúdo do Guia (simulado) */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium mb-3">Conteúdo do Guia</h3>

                  {selectedGuide.type === 'checklist' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Lavar bem as mãos antes de manusear as lentes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Verificar se a lente não está danificada</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Usar solução adequada para limpeza</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Armazenar corretamente no estojo</span>
                      </label>
                    </div>
                  )}

                  {selectedGuide.type === 'article' && (
                    <div className="prose prose-sm max-w-none">
                      <p>
                        Este guia aborda os cuidados essenciais com suas lentes de contato.
                        A higiene adequada é fundamental para prevenir infecções e garantir
                        o conforto durante o uso.
                      </p>
                      <h4>Cuidados Diários</h4>
                      <ul>
                        <li>Lave sempre as mãos antes de manusear as lentes</li>
                        <li>Use apenas solução própria para lentes de contato</li>
                        <li>Nunca use água da torneira para limpar as lentes</li>
                        <li>Substitua a solução do estojo diariamente</li>
                      </ul>
                    </div>
                  )}

                  {selectedGuide.type === 'quiz' && (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="font-medium mb-2">1. Com que frequência você deve substituir sua solução de lentes?</p>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input type="radio" name="q1" />
                            <span>Todos os dias</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" name="q1" />
                            <span>Uma vez por semana</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" name="q1" />
                            <span>Uma vez por mês</span>
                          </label>
                        </div>
                      </div>
                      <Button className="w-full">
                        Verificar Respostas
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}