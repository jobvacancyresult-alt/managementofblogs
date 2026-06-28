export const SITES = [
  {
    slug: 'coi',
    name: 'Culture of Internet',
    shortName: 'COI',
    domain: 'cultureofinternet.com',
  },
  {
    slug: 'com',
    name: 'Culture of Marketing',
    shortName: 'COM',
    domain: 'cultureofmarketing.com',
  },
  {
    slug: 'jvr',
    name: 'Job Vacancy Result',
    shortName: 'JVR',
    domain: 'jobvacancyresult.com',
  },
] as const

export type SiteSlug = (typeof SITES)[number]['slug']

export function getSiteBySlug(slug: string) {
  return SITES.find((s) => s.slug === slug)
}

export function getSiteLabel(slug: string | null | undefined) {
  if (!slug) return '—'
  return getSiteBySlug(slug)?.shortName ?? slug.toUpperCase()
}

export function getSiteSlugFromHost(host?: string | null): SiteSlug {
  const cleanHost = (host || '').toLowerCase().split(':')[0]

  if (cleanHost.includes('cultureofmarketing')) return 'com'
  if (cleanHost.includes('jobvacancyresult')) return 'jvr'

  return 'coi'
}
