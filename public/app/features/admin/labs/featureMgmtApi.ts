import { createApi } from '@reduxjs/toolkit/query/react';

import { createBaseQuery } from '@grafana/api-clients/rtkq';

import { FeatureMgmtResponse, FeatureMgmtUpdateRequest } from './types';

export const featureMgmtApi = createApi({
  reducerPath: 'featureMgmtApi',
  baseQuery: createBaseQuery({ baseURL: '/api' }),
  tagTypes: ['FeatureMgmt'],
  endpoints: (builder) => ({
    getFeatureMgmt: builder.query<FeatureMgmtResponse, void>({
      query: () => ({ url: '/featuremgmt/', showErrorAlert: false }),
      providesTags: ['FeatureMgmt'],
    }),
    updateFeatureMgmt: builder.mutation<FeatureMgmtResponse, FeatureMgmtUpdateRequest>({
      query: (body) => ({
        url: '/featuremgmt/',
        method: 'POST',
        body,
        showErrorAlert: false,
      }),
      invalidatesTags: ['FeatureMgmt'],
    }),
  }),
});

export const { useGetFeatureMgmtQuery, useUpdateFeatureMgmtMutation } = featureMgmtApi;
