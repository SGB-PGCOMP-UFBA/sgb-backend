import { MoreThanOrEqual } from 'typeorm'
import {
  toCalendarDay,
  todayAsCalendarDay
} from '@/common/utils/calendar-day.util'

export { toCalendarDay, todayAsCalendarDay }

export const ScholarshipStatusEnum = {
  INACTIVE: 'INACTIVE',
  ON_GOING: 'ON_GOING',
  EXTENDED: 'EXTENDED',
  FINISHED: 'FINISHED'
} as const

export type ScholarshipStatus =
  (typeof ScholarshipStatusEnum)[keyof typeof ScholarshipStatusEnum]

export const SCHOLARSHIP_STATUSES: ScholarshipStatus[] = [
  ScholarshipStatusEnum.INACTIVE,
  ScholarshipStatusEnum.ON_GOING,
  ScholarshipStatusEnum.EXTENDED,
  ScholarshipStatusEnum.FINISHED
]

export interface ScholarshipPeriod {
  scholarship_starts_at: Date | string
  scholarship_ends_at: Date | string
  extension_ends_at?: Date | string | null
}

export function effectiveEndDay(period: ScholarshipPeriod): string {
  const endDay = toCalendarDay(period.scholarship_ends_at)
  if (!period.extension_ends_at) return endDay

  const extensionDay = toCalendarDay(period.extension_ends_at)
  return extensionDay > endDay ? extensionDay : endDay
}

export function deriveScholarshipStatus(
  period: ScholarshipPeriod,
  referenceDay: string = todayAsCalendarDay()
): ScholarshipStatus {
  if (referenceDay < toCalendarDay(period.scholarship_starts_at)) {
    return ScholarshipStatusEnum.INACTIVE
  }

  if (referenceDay <= toCalendarDay(period.scholarship_ends_at)) {
    return ScholarshipStatusEnum.ON_GOING
  }

  if (referenceDay <= effectiveEndDay(period)) {
    return ScholarshipStatusEnum.EXTENDED
  }

  return ScholarshipStatusEnum.FINISHED
}

export function occupiesSlot(
  period: ScholarshipPeriod,
  referenceDay: string = todayAsCalendarDay()
): boolean {
  return (
    deriveScholarshipStatus(period, referenceDay) !==
    ScholarshipStatusEnum.FINISHED
  )
}

export function occupiesSlotWhere(
  referenceDay: string = todayAsCalendarDay()
): Record<string, unknown>[] {
  return [
    { scholarship_ends_at: MoreThanOrEqual(referenceDay) },
    { extension_ends_at: MoreThanOrEqual(referenceDay) }
  ]
}

export function effectiveEndSql(alias = 'scholarship'): string {
  return `GREATEST(${alias}.scholarship_ends_at, ${alias}.extension_ends_at)`
}

export function occupiesSlotSql(alias = 'scholarship'): string {
  return `${effectiveEndSql(alias)} >= CAST(:today AS date)`
}

export function derivedStatusSql(alias = 'scholarship'): string {
  return `CASE
    WHEN CAST(:today AS date) < ${alias}.scholarship_starts_at THEN '${ScholarshipStatusEnum.INACTIVE}'
    WHEN CAST(:today AS date) <= ${alias}.scholarship_ends_at THEN '${ScholarshipStatusEnum.ON_GOING}'
    WHEN CAST(:today AS date) <= ${alias}.extension_ends_at THEN '${ScholarshipStatusEnum.EXTENDED}'
    ELSE '${ScholarshipStatusEnum.FINISHED}'
  END`
}

export function scholarshipStatusPredicateSql(
  status: string,
  alias = 'scholarship'
): string | null {
  const effectiveEnd = effectiveEndSql(alias)

  switch (status) {
    case ScholarshipStatusEnum.INACTIVE:
      return `(${alias}.scholarship_starts_at > CAST(:today AS date))`
    case ScholarshipStatusEnum.ON_GOING:
      return `(${alias}.scholarship_starts_at <= CAST(:today AS date) AND ${effectiveEnd} >= CAST(:today AS date))`
    case ScholarshipStatusEnum.EXTENDED:
      return `(${alias}.scholarship_ends_at < CAST(:today AS date) AND ${alias}.extension_ends_at >= CAST(:today AS date))`
    case ScholarshipStatusEnum.FINISHED:
      return `(${effectiveEnd} < CAST(:today AS date))`
    default:
      return null
  }
}
