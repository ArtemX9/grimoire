import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { useEffect } from 'react';

import { useAppDispatch } from '@/store/hooks';

// On cache hits RTK Query skips the network request and onQueryStarted never
// runs, so the slice would not be updated. useSliceSync fires whenever `data`
// changes (including cache hits) and writes the result into the slice.
// On normal network requests both extraReducers and useSliceSync fire —
// writing the same data twice is harmless.
export function useSliceSync<TArgs, TResult>(
  queryHook: (args: TArgs) => { data?: TResult },
  args: TArgs,
  actionCreator: ActionCreatorWithPayload<TResult>,
): void {
  const dispatch = useAppDispatch();

  const { data } = queryHook(args);

  useEffect(
    function syncToSliceOnCacheHit() {
      if (data !== undefined) dispatch(actionCreator(data));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );
}
