import { createActivityLog } from '@/store/activityLogs/activityLogsSlice';
import { AppDispatch } from '@/store/store';

export const logActivity = (
  dispatch: AppDispatch,
  action: string,
  target: string,
  category: string,
  details: string,
  oldValues?: any,
  newValues?: any,
  entityType?: string,
  entityId?: number
) => {
  dispatch(createActivityLog({
    action,
    user: 'Current User', // This will be replaced by the backend with the actual user
    target,
    category,
    details,
    old_values: oldValues,
    new_values: newValues,
    entity_type: entityType,
    entity_id: entityId
  }));
};

// Specific logging functions for different modules
export const logUserActivity = (dispatch: AppDispatch, action: string, userName: string, details: string, oldValues?: any, newValues?: any, userId?: number) => {
  logActivity(dispatch, action, userName, 'user_management', details, oldValues, newValues, 'AdminUser', userId);
};

export const logVenueActivity = (dispatch: AppDispatch, action: string, venueName: string, details: string, oldValues?: any, newValues?: any, venueId?: number) => {
  logActivity(dispatch, action, venueName, 'venue_management', details, oldValues, newValues, 'Venue', venueId);
};

export const logBatchActivity = (dispatch: AppDispatch, action: string, batchName: string, details: string, oldValues?: any, newValues?: any, batchId?: number) => {
  logActivity(dispatch, action, batchName, 'batch_management', details, oldValues, newValues, 'Batch', batchId);
};

export const logPartnerActivity = (dispatch: AppDispatch, action: string, partnerName: string, details: string, oldValues?: any, newValues?: any, partnerId?: number) => {
  logActivity(dispatch, action, partnerName, 'partner_management', details, oldValues, newValues, 'Partner', partnerId);
};

export const logMemberActivity = (dispatch: AppDispatch, action: string, memberName: string, details: string, oldValues?: any, newValues?: any, memberId?: number) => {
  logActivity(dispatch, action, memberName, 'member_management', details, oldValues, newValues, 'Member', memberId);
};

export const logProgramActivity = (dispatch: AppDispatch, action: string, programName: string, details: string, oldValues?: any, newValues?: any, programId?: number) => {
  logActivity(dispatch, action, programName, 'program_management', details, oldValues, newValues, 'Program', programId);
};

export const logAmenityActivity = (dispatch: AppDispatch, action: string, amenityName: string, details: string, oldValues?: any, newValues?: any, amenityId?: number) => {
  logActivity(dispatch, action, amenityName, 'amenity_management', details, oldValues, newValues, 'Amenity', amenityId);
};

export const logAssetActivity = (dispatch: AppDispatch, action: string, assetName: string, details: string, oldValues?: any, newValues?: any, assetId?: number) => {
  logActivity(dispatch, action, assetName, 'system', details, oldValues, newValues, 'Asset', assetId);
};

export const logBatchSessionActivity = (dispatch: AppDispatch, action: string, sessionTitle: string, details: string, oldValues?: any, newValues?: any, sessionId?: number) => {
  logActivity(dispatch, action, sessionTitle, 'batch_session_management', details, oldValues, newValues, 'BatchSession', sessionId);
};

export const logProfileActivity = (dispatch: AppDispatch, action: string, userName: string, details: string, oldValues?: any, newValues?: any, profileId?: number) => {
  logActivity(dispatch, action, userName, 'profile_management', details, oldValues, newValues, 'Profile', profileId);
};

export const logFixedAssetActivity = (dispatch: AppDispatch, action: string, assetName: string, details: string, oldValues?: any, newValues?: any, assetId?: number) => {
  logActivity(dispatch, action, assetName, 'fixed_asset_management', details, oldValues, newValues, 'FixedAsset', assetId);
};