/**
 * Critical CSS inline para otimizar First Contentful Paint
 * Carregado antes do CSS principal para melhorar Core Web Vitals
 */
export function CriticalCSS() {
    return (
        <style
            dangerouslySetInnerHTML={{
                __html: `
                    /* Critical Hero Styles - Above the Fold */
                    .hero-critical {
                        position: relative;
                        background: linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f8fafc 100%);
                        overflow: hidden;
                        min-height: 80vh;
                    }
                    .hero-critical .container {
                        max-width: 1280px;
                        margin: 0 auto;
                        padding: 4rem 1rem;
                    }
                    .hero-critical h1 {
                        font-family: var(--font-poppins), system-ui, sans-serif;
                        font-size: clamp(2rem, 5vw, 3.75rem);
                        font-weight: 700;
                        line-height: 1.2;
                        color: #111827;
                        margin-bottom: 1.5rem;
                    }
                    .hero-critical .text-gradient {
                        background: linear-gradient(135deg, #0f4c75 0%, #16a34a 100%);
                        -webkit-background-clip: text;
                        background-clip: text;
                        color: transparent;
                    }
                    .hero-critical p {
                        font-family: var(--font-inter), system-ui, sans-serif;
                        font-size: clamp(1.125rem, 2vw, 1.5rem);
                        line-height: 1.6;
                        color: #4b5563;
                    }
                    .hero-critical .btn-primary {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        padding: 1rem 2rem;
                        font-size: 1.125rem;
                        font-weight: 700;
                        color: #ffffff;
                        background: linear-gradient(135deg, #0f4c75 0%, #0d4068 100%);
                        border-radius: 0.5rem;
                        box-shadow: 0 10px 20px rgba(15, 76, 117, 0.3);
                        transition: all 0.2s ease;
                        text-decoration: none;
                        border: none;
                        cursor: pointer;
                    }
                    .hero-critical .btn-primary:hover {
                        transform: scale(1.05);
                        box-shadow: 0 15px 30px rgba(15, 76, 117, 0.4);
                    }
                    /* Prevent layout shift during font load */
                    body {
                        font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
                        line-height: 1.6;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        font-family: var(--font-poppins), system-ui, -apple-system, sans-serif;
                    }
                    /* Prevent FOUT (Flash of Unstyled Text) */
                    .font-loading {
                        visibility: hidden;
                    }
                    .fonts-loaded {
                        visibility: visible;
                    }
                `,
            }}
        />
    )
}