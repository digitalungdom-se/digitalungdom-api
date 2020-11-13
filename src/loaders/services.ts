import { MailService } from "@sendgrid/mail";

import { IServices } from "interfaces";
import { UserModel, TokenModel, AgoragramModel } from "models";
import { AuthenticationService, UserService, AgoraService, NotificationService } from "services";
import { Config } from "configs";

function loadServices(mailService: MailService, config: Config): IServices {
  const authService = new AuthenticationService(TokenModel, config);
  const Notification = new NotificationService(UserModel);

  const services: IServices = {
    Authentication: authService,
    User: new UserService(UserModel, TokenModel, authService, mailService, config),
    Agora: new AgoraService(AgoragramModel, UserModel, Notification),
    Notification,
  };

  return services;
}

export { loadServices };
