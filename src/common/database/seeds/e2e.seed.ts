import { connectionSource } from '@/config/ormconfig'
import { env } from '@/config/env.validation'
import { todayAsCalendarDay } from '@/common/utils/calendar-day.util'
import { assertE2eDatabase } from '@/common/database/seeds/e2e-environment.util'
import { seedE2e } from '@/common/database/seeds/e2e-seed.util'

/** Entrada do `npm run db:seed:e2e`. Roda a partir de `dist/`, como as migrations. */
async function run(): Promise<void> {
  assertE2eDatabase(env)

  await connectionSource.initialize()
  try {
    await seedE2e(connectionSource, env, todayAsCalendarDay())
    console.log('Seed e2e aplicado.')
  } finally {
    await connectionSource.destroy()
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
