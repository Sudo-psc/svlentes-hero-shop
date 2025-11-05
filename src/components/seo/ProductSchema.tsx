'use client'

interface ProductSchemaProps {
    name: string
    description: string
    price: number
    currency?: string
    availability?: string
    brand?: string
    category?: string
    image?: string
}

export function ProductSchema({
    name,
    description,
    price,
    currency = 'BRL',
    availability = 'InStock',
    brand = 'SV Lentes',
    category,
    image
}: ProductSchemaProps) {
    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: name,
        description: description,
        brand: {
            '@type': 'Brand',
            name: brand
        },
        category: category,
        offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: currency,
            availability: `https://schema.org/${availability}`,
            seller: {
                '@type': 'Organization',
                name: 'SV Lentes',
                url: 'https://svlentes.com.br'
            }
        },
        image: image
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema, null, 0) }}
        />
    )
}
