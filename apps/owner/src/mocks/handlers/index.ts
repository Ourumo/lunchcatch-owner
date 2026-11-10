import { authHandlers } from './auth';
import { campaignHandlers } from './campaign';
import { imageUploadHandlers } from './imageUpload';
import { pointHandlers } from './points';
import { posterHandlers } from './poster';
import { reportHandlers } from './report';
import { signupFlowHandlers } from './signupFlow';
import { storeHandlers } from './store';
import { storeImageHandlers } from './storeImages';
import { storeMenuHandlers } from './storeMenus';

// 목 서버가 대신 답하는 요청 전체. 여기에 없는 요청은 가로채지 않고 그대로 네트워크로 보낸다 (browser.ts)
// 화면 흐름마다 파일을 나눴다. 요청을 추가할 때는 api/*.ts와 같은 이름의 파일에 넣는다
export const handlers = [
  ...authHandlers,
  ...storeHandlers,
  ...signupFlowHandlers,
  ...storeImageHandlers,
  ...storeMenuHandlers,
  ...imageUploadHandlers,
  ...campaignHandlers,
  ...posterHandlers,
  ...pointHandlers,
  ...reportHandlers,
];
