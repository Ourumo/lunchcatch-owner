import { http } from 'msw/http';

import { getDb } from '@owner/mocks/db';
import { ok, unauthenticated } from '@owner/mocks/response';

// 가게 정보 (api/store.ts)

export const storeHandlers = [
  http.get('*/v1/owner/store', () => {
    const db = getDb();

    return db.owner.isLoggedIn ? ok(db.store) : unauthenticated();
  }),
];
