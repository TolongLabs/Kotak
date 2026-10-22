import { useState } from 'react'
import { RoleCard } from '../../components/kotak/RoleCard'
import { StatCard } from '../../components/kotak/StatCard'
import { WhatChangedCard } from '../../components/kotak/WhatChangedCard'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { changes, dashboardStats, roles } from '../../demo/data'

export function KotakGallery() {
  const [selectedRole, setSelectedRole] = useState(roles[roles.length - 1]?.id)

  return (
    <section className="space-y-8">
      <h2 className="text-title-l">Kotak Cards Gallery</h2>
      <div className="space-y-4">
        <h3 className="text-title-s">Stat Card</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <StatCard key={stat.id} label={stat.label} value={stat.value} caption={stat.caption}>
              {stat.progress && (
                <ProgressBar label={stat.progress.label} value={Number.parseInt(stat.progress.value, 10)} />
              )}
            </StatCard>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-title-s">Role Card</h3>
        <div role="radiogroup" aria-label="Matched Roles" className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              name="gallery-role"
              selected={selectedRole === role.id}
              onSelect={() => setSelectedRole(role.id)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-title-s">What Changed Card</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {changes.map((item) => (
            <WhatChangedCard key={item.skill} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
