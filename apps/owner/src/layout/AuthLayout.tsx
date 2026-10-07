import { Outlet } from 'react-router';

const AuthLayout = () => {
  return (
    <div className="min-h-dvh min-w-mobile-min">
      <main className="mx-auto flex min-h-dvh w-full max-w-mobile flex-col gap-6 bg-bg-page px-page pt-10 pb-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-md border border-border-subtle bg-surface-subtle px-3 py-1 type-caption font-semibold text-text-secondary">
            사장님 전용
          </span>
          <h1 className="text-display-web leading-tight font-bold text-text-primary">
            런치 <span className="text-action-primary">캐치</span>
          </h1>
          <p className="type-body-sm leading-normal text-text-secondary">
            동네 직장인들을 사로잡는
            <br />
            쿠폰 제작 플랫폼
          </p>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
