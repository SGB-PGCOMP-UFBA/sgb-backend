/**
 * O driver do Postgres devolve `COUNT` e `SUM` como string, porque `bigint` e
 * `numeric` não cabem com segurança num `number` do JavaScript. As contagens
 * da API cabem, então todo agregado passa por aqui antes de sair do mapper:
 * vazio ou não numérico vira 0, nunca `NaN`.
 */
export function toAggregateNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
