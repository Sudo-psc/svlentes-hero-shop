# SEO On-Page Optimization Documentation

## Overview
This document describes the SEO improvements implemented for svlentes.com.br to enhance search engine visibility and content indexability.

## Improvements Implemented

### 1. Enhanced Sitemap (`src/app/sitemap.ts`)
**Changes:**
- Added all important public pages to the sitemap
- Fixed base URL to use `svlentes.com.br` consistently (was using `svlentes.shop`)
- Set appropriate priorities and change frequencies for each page
- Added pages: `/planos`, `/calculadora`, `/lentes-diarias`, `/como-funciona`, `/termos-uso`, `/politica-privacidade`

**Pages included with priorities:**
- Homepage: Priority 1.0, Weekly updates
- Planos: Priority 0.9, Weekly updates
- Calculadora: Priority 0.8, Monthly updates
- Lentes Diárias: Priority 0.8, Monthly updates
- Como Funciona: Priority 0.7, Monthly updates
- Agendar Consulta: Priority 0.8, Monthly updates
- Legal pages (Terms/Privacy): Priority 0.4, Yearly updates

### 2. Metadata Enhancement

#### Base Metadata (`src/lib/seo.ts`)
**Improvements:**
- Added comprehensive location-based keywords (Caratinga, Minas Gerais)
- Enhanced descriptions with specific benefits and features
- Added medical specialty keywords (tóricas, multifocais, asféricas)
- Included service-related terms (entrega automática, economia de até 40%)
- Added doctor credentials emphasis (Dr. Philipe Saraiva Cruz - CRM 69.870)

**Keywords Added:**
- Location: "lentes de contato Caratinga", "Minas Gerais"
- Medical: "lentes tóricas astigmatismo", "lentes multifocais presbiopia"
- Service: "assinatura mensal lentes", "entrega grátis lentes"
- Business: "economia lentes de contato", "acompanhamento médico lentes"

#### Page-Specific Metadata
Created/Enhanced metadata for:

**Lentes Diárias (`src/app/lentes-diarias/layout.tsx`):**
- Title: "Lentes de Contato Diárias Descartáveis | Assinatura com Entrega | SV Lentes"
- Added specific keywords for daily lenses
- Included Open Graph metadata
- Added canonical URL

**Planos (`src/app/planos/layout.tsx`):**
- Title: "Planos de Assinatura de Lentes de Contato | Entrega em Todo Brasil | SV Lentes"
- Fixed base URL from svlentes.shop to svlentes.com.br
- Enhanced description with all lens types
- Added comprehensive keywords

**Calculadora (`src/app/calculadora/layout.tsx`):**
- Created new layout file with metadata
- Title: "Calculadora de Economia | Compare Preços de Lentes de Contato | SV Lentes"
- Added calculator and pricing-related keywords

### 3. Structured Data (Schema.org JSON-LD)

#### Enabled Structured Data in Root Layout
**Location:** `src/app/layout.tsx`
- Uncommented Organization structured data
- Uncommented WebSite structured data
- Added search action for site search capability

**Data included:**
- Organization details (name, address, contact)
- Medical business information
- Physician credentials
- Service offerings with pricing
- Aggregate ratings and reviews
- Opening hours and payment methods

#### Page-Specific Structured Data

**Home Page (`src/app/page.tsx`):**
- Added FAQ structured data (FAQPage schema)
- Added Medical Business structured data with offers
- Includes doctor information and service details

**Como Funciona Page (`src/app/como-funciona/page.tsx`):**
- Added Breadcrumb structured data
- Enhanced page title and description

### 4. Technical SEO

#### Robots Configuration (`src/app/robots.ts`)
- Proper indexing rules for all pages
- Blocked admin, API, and internal routes
- Set correct sitemap URL
- Configured for both general crawlers and Googlebot

#### URL Consistency
- Fixed all instances of `svlentes.shop` to `svlentes.com.br`
- Ensured canonical URLs on all pages
- Proper alternate language tags

### 5. Content Optimization

#### Meta Descriptions
All meta descriptions now include:
- Primary service offering
- Location (Caratinga/MG)
- Doctor credentials (Dr. Philipe Saraiva Cruz - CRM 69.870)
- Key benefits (economia de até 40%, entrega automática)
- Call to action

#### Open Graph
- Consistent Open Graph metadata across all pages
- Proper image specifications (1200x630px)
- Locale set to pt_BR
- Alt text for all OG images

### 6. Semantic HTML
- Proper heading hierarchy (H1 on all pages)
- Semantic HTML5 sections
- ARIA labels where appropriate
- Proper article/section structure

## SEO Best Practices Applied

### On-Page SEO
✅ Unique, descriptive titles (50-60 characters)
✅ Compelling meta descriptions (150-160 characters)
✅ Header tag hierarchy (H1 > H2 > H3)
✅ Semantic HTML5 elements
✅ Internal linking structure
✅ Canonical URLs
✅ Alt text for images

### Technical SEO
✅ XML sitemap with all important pages
✅ Robots.txt configuration
✅ Structured data (JSON-LD)
✅ Mobile-responsive design
✅ Fast loading (Next.js optimization)
✅ HTTPS (enforced)

### Local SEO
✅ Location-based keywords (Caratinga, Minas Gerais)
✅ Google My Business integration (via structured data)
✅ Local business schema markup
✅ Doctor/physician credentials
✅ Service area defined

### E-A-T (Expertise, Authoritativeness, Trustworthiness)
✅ Doctor credentials prominently displayed
✅ CRM number in metadata
✅ Professional affiliations in structured data
✅ Years of experience mentioned
✅ Patient reviews/ratings in structured data

## Testing and Validation

### Recommended Tools
1. **Google Search Console**
   - Submit updated sitemap
   - Check for indexing issues
   - Monitor search performance

2. **Google Rich Results Test**
   - Test structured data: https://search.google.com/test/rich-results
   - Validate FAQ schema
   - Validate Medical Business schema
   - Validate Organization schema

3. **PageSpeed Insights**
   - Test mobile and desktop performance
   - Check Core Web Vitals

4. **Schema Markup Validator**
   - Validate JSON-LD: https://validator.schema.org/

### Manual Checks
- [ ] All pages have unique titles
- [ ] All pages have unique meta descriptions
- [ ] All pages have canonical URLs
- [ ] Sitemap is accessible at /sitemap.xml
- [ ] Robots.txt is accessible at /robots.txt
- [ ] Structured data validates without errors
- [ ] All internal links work
- [ ] Mobile responsiveness

## Future Enhancements

### Content
- [ ] Create blog section for content marketing
- [ ] Add more location-specific landing pages
- [ ] Create FAQ pages for specific lens types
- [ ] Add patient testimonials page

### Technical
- [ ] Create separate Open Graph images for each page
- [ ] Add video structured data for video content
- [ ] Implement Article schema for blog posts
- [ ] Add Product schema for individual lens products
- [ ] Implement Review schema with real patient reviews

### Local SEO
- [ ] Create Google My Business listing
- [ ] Add location pages for nearby cities
- [ ] Implement local business reviews schema
- [ ] Add hours of operation to all pages

## Monitoring

### Key Metrics to Track
1. **Search Console:**
   - Total impressions
   - Average position
   - Click-through rate (CTR)
   - Coverage issues

2. **Analytics:**
   - Organic traffic
   - Bounce rate
   - Time on page
   - Conversion rate from organic

3. **Rankings:**
   - Target keywords positions
   - Local search rankings
   - Branded vs non-branded traffic

### Target Keywords
Primary:
- "lentes de contato Caratinga"
- "assinatura lentes de contato"
- "oftalmologista Caratinga"

Secondary:
- "lentes diárias Caratinga"
- "lentes mensais assinatura"
- "Dr. Philipe Saraiva Cruz"
- "lentes de contato online"

Long-tail:
- "assinatura de lentes de contato com entrega"
- "lentes de contato com acompanhamento médico"
- "quanto custa lentes de contato mensal"

## Conclusion

The SEO optimization implemented provides a solid foundation for improved search engine visibility. The site now has:
- Comprehensive metadata on all pages
- Rich structured data for search engines
- Proper technical SEO configuration
- Location-specific optimization
- Clear E-A-T signals for medical content

Regular monitoring and iterative improvements based on Search Console data will help maximize organic search performance.
