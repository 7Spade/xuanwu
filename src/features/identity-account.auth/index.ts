export { AuthBackground } from './_components/auth-background'
export { AuthTabsRoot } from './_components/auth-tabs-root'
export { LoginForm } from './_components/login-form'
export { LoginView } from './_components/login-view'
export { RegisterForm } from './_components/register-form'
export { ResetPasswordDialog } from './_components/reset-password-dialog'
export { ResetPasswordForm } from './_components/reset-password-form'
// [S6] CLAIMS_HANDLER — must be registered once at app startup
export { registerClaimsHandler } from './_claims-handler'
// [S6] Frontend Party 3 — must be mounted once per authenticated session
export { useTokenRefreshListener } from './_token-refresh-listener'
