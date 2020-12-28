import { MailDataRequired } from "@sendgrid/mail";

import { config } from "configs";

export function generateSimpleEmail(to: string, templateId: string, dynamicTemplateData?: any): MailDataRequired {
  const msg: MailDataRequired = {
    to,
    from: { email: config.sendGrid.email, name: config.sendGrid.name },
    templateId,
    dynamicTemplateData,
  };

  return msg;
}
