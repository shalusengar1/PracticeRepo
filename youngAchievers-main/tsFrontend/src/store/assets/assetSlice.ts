// tsFrontend/src/slices/assetSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import * as assetService from '@/services/assetService.ts';
import { FixedAsset } from '@/types/asset'; // Import the interface
import { formatBackendError } from '@/utils/errorHandling'; // Import the error formatter

interface AssetState {
  assets: FixedAsset[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AssetState = {
  assets: [],
  status: 'idle',
  error: null,
};

// Define a type for the thunk API to specify the rejectValue type
interface ThunkApiConfig {
  rejectValue: string;
}

export const fetchAssets = createAsyncThunk<FixedAsset[], void, ThunkApiConfig>(
  'assets/fetchAssets',
  async (_, thunkAPI) => {
    try {
      const response = await assetService.getAssets();
      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(formatBackendError(error));
    }
  }
);

export const addAsset = createAsyncThunk<FixedAsset, Omit<FixedAsset, 'id'>, ThunkApiConfig>(
  'assets/addAsset',
  async (asset, thunkAPI) => {
    try {
      const response = await assetService.addAsset(asset);
      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(formatBackendError(error));
    }
  }
);

export const updateAsset = createAsyncThunk<FixedAsset, FixedAsset, ThunkApiConfig>(
  'assets/updateAsset',
  async (asset, thunkAPI) => {
    try {
      const response = await assetService.updateAsset(asset);
      return response;
    } catch (error: any)      
    {
      return thunkAPI.rejectWithValue(formatBackendError(error));
    }
  }
);

export const deleteAsset = createAsyncThunk<string, string, ThunkApiConfig>(
  'assets/deleteAsset',
  async (id, thunkAPI) => {
    try {
      await assetService.deleteAsset(id);
      return id; // Return the ID for updating the state
    } catch (error: any) {
      return thunkAPI.rejectWithValue(formatBackendError(error));
    }
  }
);

const assetSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    // You can add synchronous actions here if needed, e.g., for local filtering
    // setAssets: (state, action: PayloadAction<FixedAsset[]>) => {
    //   state.assets = action.payload;
    // },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear previous errors
      })
      .addCase(fetchAssets.fulfilled, (state, action: PayloadAction<FixedAsset[]>) => {
        state.status = 'succeeded';
        state.assets = action.payload;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch assets'; // action.payload now contains the formatted error
      })
      .addCase(addAsset.fulfilled, (state, action: PayloadAction<FixedAsset>) => {
        state.assets.unshift(action.payload);
      })
      .addCase(addAsset.rejected, (state, action) => {
        state.error = action.payload || 'Failed to add asset';
      })
      .addCase(updateAsset.fulfilled, (state, action: PayloadAction<FixedAsset>) => {
        state.assets = state.assets.map(asset =>
          asset.id === action.payload.id ? action.payload : asset
        );
      })
      .addCase(updateAsset.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update asset';
      })
      .addCase(deleteAsset.fulfilled, (state, action: PayloadAction<string>) => {
        state.assets = state.assets.filter(asset => asset.id !== action.payload);
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete asset';
      });
  },
});

// export const { setAssets } = assetSlice.actions; // If you added synchronous reducers

export const selectAllAssets = (state: RootState) => state.assets.assets;
export const selectAssetState = (state: RootState) => state.assets; // Exports status and error too

export default assetSlice.reducer;
