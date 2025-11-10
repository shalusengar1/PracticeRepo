import { configureStore, combineReducers, Action } from "@reduxjs/toolkit";
import authReducer, { logout } from "./user/authSlice"; // Import the logout action
import venueReducer from "./venue/venueSlice"; 
import partnerReducer from "./partner/partnerSlice"; 
import profileReducer from "./profile/profileSlice"; 
import holidayReducer from './venue/holidaySlice'; 
import userReducer from "./user/userSlice"; 
import programReducer from './program/programSlice';
import assetReducer from "./assets/assetSlice";
import batchReducer from './batch/batchSlice';
import amenityReducer from './amenity/amenitySlice';
import memberReducer from './member/memberSlice';
import sessionDetailsReducer from './batch/sessionDetailsSlice';
import activityLogsReducer from './activityLogs/activityLogsSlice';
import dashboardReducer from './dashboard/dashboardSlice';
import attendanceReducer from './attendance/attendanceSlice';

// Combine all your application's reducers
const appReducer = combineReducers({
  auth: authReducer,
  venues: venueReducer,
  holidays: holidayReducer, 
  partner: partnerReducer,
  profile: profileReducer,
  users: userReducer,
  programs: programReducer,
  assets: assetReducer,
  batch: batchReducer,
  amenities: amenityReducer,
  members: memberReducer,
  sessionDetails: sessionDetailsReducer,
  activityLogs: activityLogsReducer,
  dashboard: dashboardReducer,
  attendance: attendanceReducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: Action) => {
  if (action.type === logout.type) {
    state = undefined; // This will reset all slices to their initial state
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer, // Use the enhanced rootReducer
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;