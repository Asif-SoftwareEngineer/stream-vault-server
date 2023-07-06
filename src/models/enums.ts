export enum Role {
  None = 'none',
  Member = 'member',
  User = 'user',
  Admin = 'admin',
}

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
  Free = 'free',
  Monthly = 'monthly',
  Annually = 'yearly',
}

export enum ImageType {
  ChannelBanner = 'channelBanner',
  ChanneProfilePicture = 'channelProfilePic',
  VideoThumbnail = 'vidThumbnail',
}

export enum VideoUploadStatus {
  Pending = 'pending',
  Uploading = 'uploading',
  Completed = 'completed',
  Failed = 'failed',
}

export enum VideoPublishStage {
  Uploaded = 'uploaded',
  InformationAdded = 'informationAdded',
  UnderReview = 'underReview',
  Approved = 'approved',
  Rejected = 'rejected',
  Published = 'published',
}
