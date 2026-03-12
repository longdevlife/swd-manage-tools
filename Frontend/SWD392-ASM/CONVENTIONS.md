# 📋 Coding Conventions — SWD392 Task Manager

Tài liệu này quy định các quy tắc code chung.
 **Mọi thành viên phải tuân thủ.**

---

## 1. Cấu trúc thư mục

```
src/
├── assets/          # Hình ảnh, fonts, icons tĩnh
├── components/      # Components dùng chung toàn dự án
│   └── ui/          # shadcn/ui components (KHÔNG tự sửa)
├── config/          # Cấu hình (constants, queryClient)
├── context/         # React Context (Theme, Language...)
├── features/        # ⭐ THƯ MỤC CHÍNH — chia theo module
│   └── [module]/
│       ├── api/         # API calls riêng module
│       ├── components/  # Components riêng module
│       ├── hooks/       # Hooks riêng module
│       └── index.js     # Barrel export
├── hooks/           # Custom hooks dùng chung
├── layouts/         # Layout components (MainLayout, AuthLayout)
├── lib/             # Utility wrappers (utils.js)
├── pages/           # Page-level components
├── routes/          # Route config
├── services/        # Axios instance
├── stores/          # Redux store + slices
└── utils/           # Pure helper functions
```

---

## 2. Naming Conventions

| Loại              | Quy tắc                   | Ví dụ                                  |
| ----------------- | ------------------------- | -------------------------------------- |
| **Components**    | PascalCase                | `TaskCard.jsx`, `LoginForm.jsx`        |
| **Hooks**         | camelCase, prefix `use`   | `useAuth.js`, `useTasks.js`            |
| **Utils/Helpers** | camelCase                 | `formatDate.js`, `validators.js`       |
| **Redux Slices**  | camelCase, suffix `Slice` | `authSlice.js`, `taskSlice.js`         |
| **API files**     | camelCase, suffix `Api`   | `authApi.js`, `tasksApi.js`            |
| **Constants**     | UPPER_SNAKE_CASE          | `TASK_STATUS`, `API_ENDPOINTS`         |
| **CSS classes**   | Tailwind utilities        | Dùng Tailwind, KHÔNG viết CSS thủ công |
| **Folders**       | kebab-case hoặc camelCase | `features/auth/`, `components/ui/`     |

---

## 3. Quy tắc import

Thứ tự import (tách bằng dòng trống):

```jsx
// 1. React & third-party libraries
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// 2. Config, stores, services
import { QUERY_KEYS } from '@/config/constants';
import { store } from '@/stores/store';

// 3. Components
import { Button } from '@/components/ui/button';

// 4. Hooks, utils
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatDate';

// 5. Relative imports (cùng feature)
import { LoginForm } from './components/LoginForm';
```

> ⚠️ Luôn dùng `@/` thay vì `../../` để import.

---

## 4. Component Structure Template

```jsx
// 1. Imports
import { useState } from 'react';
import { cn } from '@/lib/utils';

// 2. Component definition (LUÔN dùng named export)
export function MyComponent({ title, className, ...props }) {
  // 3. Hooks
  const [value, setValue] = useState('');

  // 4. Handlers
  const handleClick = () => {
    // ...
  };

  // 5. Render
  return (
    <div className={cn('base-classes', className)} {...props}>
      {title}
    </div>
  );
}
```

---

## 5. API Pattern

```js
// src/features/[module]/api/[module]Api.js
import axiosClient from '@/services/axiosClient';
import { API_ENDPOINTS } from '@/config/constants';

export const getItemsApi = (params) => {
  return axiosClient.get(API_ENDPOINTS.ITEMS.BASE, { params });
};

export const createItemApi = (data) => {
  return axiosClient.post(API_ENDPOINTS.ITEMS.BASE, data);
};
```

---

## 6. React Query Hook Pattern

```js
// src/features/[module]/hooks/useItems.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { getItemsApi, createItemApi } from '../api/itemsApi';

export function useItems(filters) {
  return useQuery({
    queryKey: QUERY_KEYS.ITEMS.LIST(filters),
    queryFn: () => getItemsApi(filters),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITEMS.ALL });
    },
  });
}
```

---

## 7. Redux Slice Pattern

```js
// src/stores/[name]Slice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  /* ... */
};

const mySlice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
    reset: () => initialState,
  },
});

export const { setData, reset } = mySlice.actions;
export const selectData = (state) => state.myFeature.data;
export default mySlice.reducer;
```

---

## 8. Git Commit Message Format

```
<type>(<scope>): <mô tả ngắn>

type: feat | fix | refactor | style | docs | chore | test
scope: auth | tasks | ui | config | ...
```

**Ví dụ:**

```
feat(auth): add login form with validation
fix(tasks): fix task card not showing priority
refactor(config): move constants to separate file
```

---

## 9. Các quy tắc khác

- ✅ **Luôn dùng `named export`**, KHÔNG dùng `export default` (trừ page components)
- ✅ **Dùng `cn()` để merge Tailwind classes** khi cần conditional styling
- ✅ **Mỗi component 1 file**, KHÔNG viết nhiều components trong 1 file
- ✅ **Props destructuring** ở parameter, KHÔNG dùng `props.xxx`
- ❌ **KHÔNG commit `.env`** — chỉ commit `.env.example`
- ❌ **KHÔNG sửa file trong `components/ui/`** — đây là shadcn generated
- ❌ **KHÔNG viết CSS thủ công** — dùng Tailwind utilities
- ❌ **KHÔNG dùng `var`, luôn dùng `const` / `let`**
