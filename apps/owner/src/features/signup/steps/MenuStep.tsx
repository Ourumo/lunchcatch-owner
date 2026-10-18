import { MAX_MENUS, menuInputRules } from '@owner/api/signupFlow';
import { MenuListFields } from '@owner/ui/MenuListFields/MenuListFields';

import { useSignupFlow } from '../useSignupFlow';

// 대표 메뉴 목록과 추가·수정·삭제. 선택 단계라 메뉴 없이도 등록 신청을 완료할 수 있다
export const MenuStep = () => {
  const { updateStepValues, values } = useSignupFlow();

  return (
    <div className="px-page pt-6 pb-8">
      <MenuListFields
        maxMenus={MAX_MENUS}
        menus={values.menu.menus}
        onChange={(menus) => updateStepValues('menu', { menus })}
        rules={menuInputRules}
      />
    </div>
  );
};
