import { env } from "bun-jcc/helpers";

export const mail = {
  /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | log writes the message to the console. array keeps it in memory for
    | tests. smtp talks to a mail server. nodemailer uses the Nodemailer
    | package. resend and sendgrid post to those email APIs. twilio sends
    | the message through the Twilio Messages API.
    |
    */

  default: env("MAIL_MAILER", "log"),

  from: {
    address: env("MAIL_FROM_ADDRESS", "hello@example.com"),
    name: env("MAIL_FROM_NAME", "JCC"),
  },

  mailers: {
    log: { transport: "log" },
    array: { transport: "array" },
    smtp: {
      transport: "smtp",
      host: env("MAIL_HOST", "127.0.0.1"),
      port: env("MAIL_PORT", 2525),
      username: env("MAIL_USERNAME", ""),
      password: env("MAIL_PASSWORD", ""),
      encryption: env("MAIL_ENCRYPTION", ""),
    },
    nodemailer: {
      transport: "nodemailer",
      host: env("MAIL_HOST", "127.0.0.1"),
      port: env("MAIL_PORT", 587),
      username: env("MAIL_USERNAME", ""),
      password: env("MAIL_PASSWORD", ""),
      encryption: env("MAIL_ENCRYPTION", "starttls"),
    },
    resend: {
      transport: "resend",
      key: env("RESEND_API_KEY", ""),
    },
    sendgrid: {
      transport: "sendgrid",
      key: env("SENDGRID_API_KEY", ""),
    },
    twilio: {
      transport: "twilio",
      sid: env("TWILIO_ACCOUNT_SID", ""),
      token: env("TWILIO_AUTH_TOKEN", ""),
      from: env("TWILIO_FROM", ""),
    },
  },
};
