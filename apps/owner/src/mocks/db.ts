import { createSeed, MOCK_DB_VERSION, type MockDb } from './seed';

// 목 서버의 데이터 저장소. 진짜 서버의 DB 역할을 한다.
// MSW 핸들러는 서비스 워커가 아니라 이 페이지(브라우저 탭) 안에서 실행되므로 sessionStorage를 쓸 수 있다.
// - 메모리에 들고 있다가 바뀔 때마다 sessionStorage에 저장해, 새로고침해도 로그인 상태와 바꾼 데이터가 이어진다
// - sessionStorage는 탭마다 따로라 새 탭은 처음 상태(로그아웃)로 시작한다. 시연할 때 다른 사람의 상태가 섞이지 않는다
// - 로그아웃하면 처음 상태로 되돌린다. "시연 데이터 초기화" 버튼을 따로 두지 않는다

const STORAGE_KEY = 'lunchcatch-owner-mock-db';

const load = (): MockDb => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (saved) {
      const db = JSON.parse(saved) as MockDb;

      // 시연 데이터 모양이 바뀐 뒤 예전에 저장한 값이 남아 있으면 버린다
      if (db.version === MOCK_DB_VERSION) {
        return db;
      }
    }
  } catch {
    // 저장한 값을 읽지 못하면 처음 상태로 시작한다
  }

  return createSeed();
};

let db: MockDb | null = null;

// 지금 데이터. 처음 부를 때 저장한 값을 읽는다
export const getDb = () => {
  db ??= load();
  return db;
};

// 저장한다. sessionStorage는 탭마다 약 5MB까지라, 사진이 많아 넘치면 저장하지 못한다.
// 그때는 메모리에만 두고 시연은 이어 간다. 새로고침하면 마지막으로 저장한 상태로 돌아간다
const save = (current: MockDb) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    console.warn(
      '[목 모드] 저장 공간이 부족해 이번 변경은 새로고침하면 사라집니다.',
    );
  }
};

// 핸들러가 데이터를 바꾼 뒤 부른다. 바꾸는 함수를 받아 적용하고 저장한다
export const updateDb = (change: (current: MockDb) => void) => {
  const current = getDb();

  change(current);
  save(current);
};

// 데이터를 통째로 바꾼다 (회원가입으로 새 점주를 만들 때, 시연 상황을 바꿀 때)
export const replaceDb = (next: MockDb) => {
  db = next;
  save(next);
};

// 처음 상태로 되돌린다 (로그아웃)
export const resetDb = () => {
  db = createSeed();
  sessionStorage.removeItem(STORAGE_KEY);
};
