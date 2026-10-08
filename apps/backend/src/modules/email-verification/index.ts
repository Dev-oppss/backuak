import EmailVerificationModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const EMAIL_VERIFICATION_MODULE = "emailVerification"

export default Module(EMAIL_VERIFICATION_MODULE, {
  service: EmailVerificationModuleService,
})
