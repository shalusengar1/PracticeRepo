<?php

namespace App\Traits;

use App\Models\ActionLog;
use Illuminate\Http\Request;

trait LogsActivity
{
    protected function logActivity(
        string $action,
        string $target,
        string $category,
        string $details,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $entityType = null,
        ?int $entityId = null
    ): void {
        $user = auth('sanctum')->user();
        $userName = $user ? "{$user->first_name} {$user->last_name}" : 'System';

        ActionLog::create([
            'action' => $action,
            'user' => $userName,
            'target' => $target,
            'category' => $category,
            'details' => $details,
            'ip_address' => request()->ip(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'performed_by' => $user?->id,
            'entity_type' => $entityType,
            'entity_id' => $entityId
        ]);
    }

    protected function logUserAction(string $action, $user, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            "{$user->first_name} {$user->last_name}",
            'user_management',
            $details,
            $oldValues,
            $newValues,
            get_class($user),
            $user->id
        );
    }

    protected function logVenueAction(string $action, $venue, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            $venue->venue_name,
            'venue_management',
            $details,
            $oldValues,
            $newValues,
            get_class($venue),
            $venue->venue_id
        );
    }

    protected function logBatchAction(string $action, $batch, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            $batch->name,
            'batch_management',
            $details,
            $oldValues,
            $newValues,
            get_class($batch),
            $batch->id
        );
    }

    protected function logPartnerAction(string $action, $partner, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            "{$partner->name}",
            'partner_management',
            $details,
            $oldValues,
            $newValues,
            get_class($partner),
            $partner->id
        );
    }

    protected function logProgramAction(string $action, $program, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            $program->name,
            'program_management',
            $details,
            $oldValues,
            $newValues,
            get_class($program),
            $program->id
        );
    }

    protected function logAmenityAction(string $action, $amenity, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            $amenity->name,
            'amenity_management',
            $details,
            $oldValues,
            $newValues,
            get_class($amenity),
            $amenity->id
        );
    }

    protected function logAssetAction(string $action, $asset, string $details, ?array $oldValues = null): void
    {
        $this->logActivity(
            $action,
            $asset->name,
            'system',
            $details,
            $oldValues,
            $asset->toArray(),
            get_class($asset),
            $asset->id
        );
    }

    protected function logMemberAction(string $action, $member, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            "{$member->name}",
            'member_management',
            $details,
            $oldValues,
            $newValues,
            get_class($member),
            $member->id
        );
    }

    protected function logBatchSessionAction(string $action, $session, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            $session->title ?? "Session #{$session->id}",
            'batch_session_management',
            $details,
            $oldValues,
            $newValues,
            get_class($session),
            $session->id
        );
    }

    protected function logProfileAction(string $action, $profile, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            "{$profile->user->first_name} {$profile->user->last_name}",
            'profile_management',
            $details,
            $oldValues,
            $newValues,
            get_class($profile),
            $profile->id
        );
    }

    protected function logFixedAssetAction(string $action, $asset, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        $this->logActivity(
            $action,
            $asset->name,
            'fixed_asset_management',
            $details,
            $oldValues,
            $newValues,
            get_class($asset),
            $asset->id
        );
    }

    protected function logAttendanceAction(string $action, $person, string $details, ?array $oldValues = null, ?array $newValues = null): void
    {
        // $person can be either a Member or a Partner model instance
        $this->logActivity(
            $action,
            $person->name, 
            'attendance_management',
            $details,
            $oldValues,
            $newValues,
            get_class($person),
            $person->id
        );
    }

}