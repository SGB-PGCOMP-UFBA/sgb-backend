process.env.TZ = 'America/Sao_Paulo'

import { Logger } from '@nestjs/common'

Logger.overrideLogger(false)
