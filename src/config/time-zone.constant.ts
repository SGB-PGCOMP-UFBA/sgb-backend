/**
 * As colunas timestamp não guardam fuso. O banco (default now()) e o Node
 * (datas vindas do código e leitura) precisam usar o mesmo fuso, senão o
 * horário gravado e o lido divergem conforme o fuso de cada máquina.
 */
export const APP_TIME_ZONE = 'America/Sao_Paulo'
