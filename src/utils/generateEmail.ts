import { MailDataRequired } from "@sendgrid/mail";

import { config } from "configs";

export function generateSimpleEmail(to: string, templateId: string, dynamicTemplateData?: any): MailDataRequired {
  const msg: MailDataRequired = {
    to,
    from: config.sendGrid.email,
    templateId,
    dynamicTemplateData,
  };

  return msg;
}
