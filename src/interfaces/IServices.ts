import { UserService, AuthenticationService, AgoraService, NotificationService } from "services";

export interface IServices {
  User: UserService;
  Authentication: AuthenticationService;
  Agora: AgoraService;
  Notification: NotificationService;
}
