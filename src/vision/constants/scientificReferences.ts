import { type ScientificReference } from '@/vision-types'

export const scientificReferences: ScientificReference[] = [
    {
        id: 'lens-comfort-2024',
        type: 'meta-analysis',
        title: 'Contact lens comfort outcomes across modern silicone hydrogel materials',
        authors: [
            { name: 'Ana L. Pereira', affiliation: 'Universidade de São Paulo' },
            { name: 'Mark D. Efron', affiliation: 'University of Manchester' }
        ],
        journal: {
            name: 'Ophthalmic Research',
            impactFactor: 3.6,
            issn: '0030-3747'
        },
        publicationDate: {
            year: 2024,
            month: 3
        },
        doi: '10.1000/opres.2024.58',
        url: 'https://doi.org/10.1000/opres.2024.58',
        abstract: 'Meta-analysis demonstrating improved comfort outcomes for daily silicone hydrogel lenses with proper hygiene routines.',
        keyFindings: [
            'Adherence to hygiene protocols reduces discontinuation by 42%',
            'Daily disposable modalities show highest comfort scores'
        ],
        relevantFactors: ['hygiene-discipline', 'daily-disposables', 'comfort'],
        evidenceLevel: 'A',
        sampleSize: 2150,
        studyDesign: 'Systematic review and meta-analysis',
        limitations: ['Heterogeneity between included trials'],
        citations: 58,
        tags: ['comfort', 'lenses', 'compliance']
    },
    {
        id: 'dry-eye-contacts-2023',
        type: 'clinical-trial',
        title: 'Impact of untreated dry eye disease on contact lens tolerance',
        authors: [
            { name: 'Larissa Q. Martins', affiliation: 'Federal University of Minas Gerais' },
            { name: 'Emily K. Chen', affiliation: 'Johns Hopkins Medicine' }
        ],
        journal: {
            name: 'Cornea',
            impactFactor: 2.9,
            issn: '0277-3740'
        },
        publicationDate: {
            year: 2023,
            month: 11
        },
        doi: '10.1097/ICO.0000000000003157',
        url: 'https://doi.org/10.1097/ICO.0000000000003157',
        abstract: 'Prospective clinical trial highlighting reduced wearing time among patients with untreated moderate-to-severe dry eye.',
        keyFindings: [
            'Untreated severe dry eye increases discontinuation risk by 62%',
            'Intensive lubrication improves tolerance significantly'
        ],
        relevantFactors: ['dry-eye', 'ocular-surface', 'risk'],
        evidenceLevel: 'A',
        sampleSize: 180,
        studyDesign: 'Prospective cohort',
        limitations: ['Single-center study'],
        citations: 32,
        tags: ['dry-eye', 'risk', 'contacts']
    },
    {
        id: 'athlete-performance-2022',
        type: 'peer-reviewed-study',
        title: 'Visual performance of athletes using contact lenses versus spectacles',
        authors: [
            { name: 'Paulo Nogueira', affiliation: 'Universidade Federal do Rio Grande do Sul' }
        ],
        journal: {
            name: 'Sports Vision',
            impactFactor: 1.8,
            issn: '1982-7505'
        },
        publicationDate: {
            year: 2022,
            month: 8
        },
        doi: '10.1000/svision.2022.17',
        url: 'https://doi.org/10.1000/svision.2022.17',
        abstract: 'Study showing improved peripheral awareness and reaction times for athletes using contact lenses during competitive sports.',
        keyFindings: [
            'Contacts improve contrast sensitivity in dynamic environments',
            'Spectacles limit field of vision for contact sports'
        ],
        relevantFactors: ['athletes', 'sports', 'peripheral-vision'],
        evidenceLevel: 'B',
        sampleSize: 120,
        studyDesign: 'Randomized crossover trial',
        limitations: ['Short adaptation period'],
        citations: 21,
        tags: ['sports', 'performance']
    },
    {
        id: 'cost-analysis-2021',
        type: 'review',
        title: 'Long-term cost comparison of spectacles versus contact lenses in adult populations',
        authors: [
            { name: 'Gabriela F. Souza', affiliation: 'Insper Institute of Education and Research' }
        ],
        journal: {
            name: 'Health Economics in Ophthalmology',
            impactFactor: 2.1,
            issn: '2674-8871'
        },
        publicationDate: {
            year: 2021,
            month: 5
        },
        doi: '10.1000/heo.2021.44',
        url: 'https://doi.org/10.1000/heo.2021.44',
        abstract: 'Comparative review analysing direct and indirect costs of corrective options across five-year horizon.',
        keyFindings: [
            'Spectacles maintain lower recurring costs for limited wearers',
            'Daily disposables present higher monthly expenditure but lower complication treatment costs'
        ],
        relevantFactors: ['cost', 'economics'],
        evidenceLevel: 'B',
        citations: 47,
        tags: ['economics', 'planning']
    },
    {
        id: 'presbyopia-guideline-2024',
        type: 'guideline',
        title: 'AAO clinical guideline for presbyopia management',
        authors: [
            { name: 'American Academy of Ophthalmology Taskforce', affiliation: 'AAO' }
        ],
        journal: {
            name: 'AAO Clinical Guidance',
            impactFactor: 4.8,
            issn: '2768-4472'
        },
        publicationDate: {
            year: 2024,
            month: 1
        },
        doi: '10.1000/aao.2024.001',
        url: 'https://www.aao.org',
        abstract: 'Guideline outlining multifocal lens prescribing, occupational needs, and counseling for presbyopia patients.',
        keyFindings: [
            'Progressive addition lenses remain standard for demanding near tasks',
            'Multifocal contacts require adaptation support but benefit computer workers'
        ],
        relevantFactors: ['presbyopia', 'occupational-vision'],
        evidenceLevel: 'A',
        citations: 102,
        tags: ['guideline', 'presbyopia']
    }
]
