'use client'

import { SwatchBookIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// "Base" is a reserved brand name (see validateBrandName), so it's safe to
// reuse as the Select value standing in for `selectedBrand === null`.
const BASE_VALUE = 'Base'

export function BrandSwitcher({
  realBrands,
  pendingBrands,
  selectedBrand,
  onSelectBrand,
}: {
  realBrands: string[]
  pendingBrands: string[]
  // null means Base — same convention as BrandsSidebar.
  selectedBrand: string | null
  onSelectBrand: (name: string | null) => void
}) {
  const brands = [...new Set([...realBrands, ...pendingBrands])].sort((a, b) => a.localeCompare(b))

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="brand-switcher" className="sr-only">
        Brand
      </Label>
      <Select
        value={selectedBrand ?? BASE_VALUE}
        onValueChange={value => onSelectBrand(value === BASE_VALUE ? null : ((value as string | null) ?? null))}
        disabled={brands.length === 0}
      >
        <SelectTrigger
          id="brand-switcher"
          className={cn('min-w-40', selectedBrand !== null && 'border-primary dark:border-primary')}
          aria-label="Brand"
        >
          <SwatchBookIcon
            aria-hidden="true"
            className={selectedBrand !== null ? 'text-primary' : 'text-muted-foreground'}
          />
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="end">
          <SelectItem value={BASE_VALUE}>Base</SelectItem>
          {brands.map(brand => (
            <SelectItem key={brand} value={brand}>
              <span className="min-w-0 truncate">{brand}</span>
              {pendingBrands.includes(brand) && <Badge variant="default">Pending</Badge>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
