'use client'

import { SITES, type SiteSlug } from '@/lib/sites'

type Props = {
  selectedSite: SiteSlug
  onSiteChange: (site: SiteSlug) => void
  onPublish: (site: SiteSlug) => void
  onSaveDraft: () => void
  loading?: boolean
  variant?: 'dark' | 'light'
}

const siteStyles: Record<SiteSlug, { ring: string; btn: string; activeDark: string; activeLight: string }> = {
  coi: {
    ring: 'ring-blue-500',
    btn: 'bg-blue-600 hover:bg-blue-700',
    activeDark: 'border-blue-500 bg-blue-500/10 text-blue-300',
    activeLight: 'border-blue-600 bg-blue-50 text-blue-700',
  },
  com: {
    ring: 'ring-purple-500',
    btn: 'bg-purple-600 hover:bg-purple-700',
    activeDark: 'border-purple-500 bg-purple-500/10 text-purple-300',
    activeLight: 'border-purple-600 bg-purple-50 text-purple-700',
  },
  jvr: {
    ring: 'ring-emerald-500',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    activeDark: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
    activeLight: 'border-emerald-600 bg-emerald-50 text-emerald-700',
  },
}

export default function PublishSiteButtons({
  selectedSite,
  onSiteChange,
  onPublish,
  onSaveDraft,
  loading = false,
  variant = 'dark',
}: Props) {
  const isDark = variant === 'dark'
  const labelClass = isDark ? 'text-gray-400' : 'text-gray-500'
  const cardBase = isDark
    ? 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'

  return (
    <div className="space-y-3">
      <div>
        <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${labelClass}`}>
          Publish to website
        </p>
        <div className="flex flex-wrap gap-2">
          {SITES.map((site) => {
            const styles = siteStyles[site.slug]
            const isSelected = selectedSite === site.slug
            return (
              <button
                key={site.slug}
                type="button"
                onClick={() => onSiteChange(site.slug)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  isSelected
                    ? `${isDark ? styles.activeDark : styles.activeLight} ring-1 ${styles.ring}`
                    : cardBase
                }`}
              >
                {site.shortName}
              </button>
            )
          })}
        </div>
        <p className={`text-xs mt-2 ${labelClass}`}>
          {getSiteDomainLabel(selectedSite)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={loading}
          className={
            isDark
              ? 'px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50'
              : 'px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50'
          }
        >
          Save Draft
        </button>
        {SITES.map((site) => (
          <button
            key={site.slug}
            type="button"
            onClick={() => onPublish(site.slug)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${siteStyles[site.slug].btn}`}
          >
            {loading && selectedSite === site.slug ? 'Publishing...' : `Publish to ${site.shortName}`}
          </button>
        ))}
      </div>
    </div>
  )
}

function getSiteDomainLabel(slug: SiteSlug) {
  const site = SITES.find((s) => s.slug === slug)
  return site ? `Will appear on ${site.domain}` : ''
}
