export const AgencyEnum = {
  ALL: 'Todas',
  CAPES: 'CAPES',
  CNPQ: 'CNPQ',
  FAPESB: 'FAPESB',
  OUTRAS: 'OUTRAS'
}

export function getAgencyNameByKeyOrDefault(key) {
  return AgencyEnum[key] || AgencyEnum.OUTRAS
}
