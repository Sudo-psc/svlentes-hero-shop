import {defineField, defineType} from 'sanity'

export const articleType = defineType({
  name: 'article',
  title: 'Artigos',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Título',
      validation: (Rule) => Rule.required().min(10).max(120),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'title',
        maxLength: 200,
        slugify: (value) =>
          value
            ?.toLowerCase()
            .normalize('NFD')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 200) ?? '',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      type: 'text',
      title: 'Resumo',
      rows: 3,
      validation: (Rule) => Rule.required().min(60).max(320),
    }),
    defineField({
      name: 'metaTitle',
      type: 'string',
      title: 'Título SEO',
      validation: (Rule) => Rule.required().min(10).max(160),
    }),
    defineField({
      name: 'metaDescription',
      type: 'text',
      title: 'Meta Description',
      rows: 3,
      validation: (Rule) => Rule.required().min(50).max(320),
    }),
    defineField({
      name: 'keywords',
      type: 'array',
      title: 'Palavras-chave',
      of: [defineField({name: 'keyword', type: 'string'})],
      validation: (Rule) => Rule.min(3),
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      title: 'Imagem de capa',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Texto alternativo',
          validation: (Rule) => Rule.required().min(10).max(160),
        }),
        defineField({
          name: 'sourceUrl',
          type: 'url',
          title: 'URL da fonte',
        }),
        defineField({
          name: 'caption',
          type: 'string',
          title: 'Legenda',
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      title: 'Publicado em',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'contentFormat',
      type: 'string',
      title: 'Formato do conteúdo',
      options: {
        list: [
          {title: 'Markdown', value: 'markdown'},
          {title: 'HTML', value: 'html'},
          {title: 'Rich text', value: 'portableText'},
        ],
        layout: 'radio',
      },
      initialValue: 'markdown',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      type: 'text',
      title: 'Conteúdo',
      rows: 80,
      validation: (Rule) => Rule.required().min(500),
    }),
    defineField({
      name: 'references',
      type: 'array',
      title: 'Referências',
      of: [defineField({name: 'reference', type: 'url'})],
    }),
    defineField({
      name: 'author',
      type: 'object',
      title: 'Autor',
      fields: [
        defineField({
          name: 'name',
          type: 'string',
          title: 'Nome',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'role',
          type: 'string',
          title: 'Função',
        }),
        defineField({
          name: 'credentials',
          type: 'string',
          title: 'Credenciais',
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ctaPhone',
      type: 'string',
      title: 'Telefone CTA',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'metaDescription',
      media: 'coverImage',
    },
  },
})
