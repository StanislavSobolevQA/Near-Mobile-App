export type RootStackParamList = {
  Auth: undefined;
  Map: undefined;
  TasksList: undefined;
  TaskDetail: { taskId: string };
  EditTask: { taskId: string };
  CreateTask: undefined;
  ChatsList: undefined;
  Chat: { chatId: string };
  Profile: undefined;
  PublicProfile: { userId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
