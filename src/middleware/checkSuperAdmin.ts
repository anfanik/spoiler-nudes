import {Context, NextFunction} from 'grammy'

const superAdminId = +process.env.ADMIN_ID
export default function checkSuperAdmin(context: Context, next: NextFunction) {
  if (context.from.id !== superAdminId) {
    return
  }
  return next()
}
