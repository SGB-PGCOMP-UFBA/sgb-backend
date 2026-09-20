import { Module } from '@nestjs/common'
import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter'
import { join } from 'path'
import { env } from '@/config/env.validation'
import { EmailService } from './email.service'

const templatesDir = join(__dirname, './templates')

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD
        },
        secure: false
      },
      defaults: {
        from: `No Reply <${env.EMAIL_USER}>`
      },
      template: {
        dir: templatesDir,
        adapter: new HandlebarsAdapter(),
        options: {
          strict: false
        }
      },
      options: {
        layout: 'layout',
        partials: {
          dir: join(templatesDir, 'partials'),
          options: {
            strict: false
          }
        }
      }
    })
  ],
  providers: [EmailService],
  exports: [EmailService]
})
export class EmailModule {}
