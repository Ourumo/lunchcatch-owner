import { TopBar } from '@owner/components/TopBar/TopBar';

export interface ComingSoonProps {
  title: string;
  // 없으면 뒤로 가기 버튼을 숨긴다 (탭 첫 화면)
  onBack?: () => void;
}

// 메뉴나 탭은 연결했지만 아직 만들지 않은 화면. 빈 화면이나 404 대신 보여준다
export const ComingSoon = ({ onBack, title }: ComingSoonProps) => {
  return (
    <>
      <TopBar onBack={onBack} title={title} />
      <p className="px-page py-10 text-center text-body-sm-mobile text-text-secondary">
        {title} 화면은 준비 중이에요
      </p>
    </>
  );
};
