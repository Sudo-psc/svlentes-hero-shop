import Script from 'next/script'
interface StructuredDataProps {
    data: object | object[]
}
export function StructuredData({ data }: StructuredDataProps) {
    const structuredData = Array.isArray(data) ? data : [data]
    return (
        <>
            {structuredData.map((item, index) => (
                <Script
                    key={index}
                    id={`structured-data-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(item)
                    }}
                />
            ))}
        </>
    )
}