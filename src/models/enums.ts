/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: string
 *       enum: [none, clerk, cashier, manager]
 */
export enum Role {
  None = 'none',
  Member = 'member',
  User = 'user',
  Admin = 'admin',
}

/**
 * @swagger
 * components:
 *   schemas:
 *     PhoneType:
 *       type: string
 *       enum: [none, mobile, home, work]
 */
export enum PhoneType {
  None = 'none',
  Mobile = 'mobile',
  Home = 'home',
  Work = 'work',
}

export enum LanguageType {
  English = 'english',
  Arabic = 'arabic',
  Spanish = 'spanish',
  French = 'french',
  Russian = 'russian',
  Urdu = 'urdu',
  Hindi = 'hindi',
  German = 'german',
}

export enum Gender {
  Male = 'male',
  Female = 'female',
}

export enum LogEventType {
  AppLanded = 'app_landed',
  StreamInit = 'video_start',
  StreamDuation = 'view_duration',
  ReAuthenticate = 're_authenticate',
  SignOut = 'sign_out',
  CancelPayment = 'cancel_payment',
  StreamVaultPaymentApproved = 'dev_payment_approved',
  ErrorRaised = 'error_raised',
}

export enum MembershipType {
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  SemiAnnually = 'half-yearly',
  Annually = 'yearly',
}
