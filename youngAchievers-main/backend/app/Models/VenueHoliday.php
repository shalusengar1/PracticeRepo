<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

class VenueHoliday extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'venue_id',
        'name',
        'holiday_type',
        'date',
        'start_date',
        'end_date',
        'recurring_day',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class, 'venue_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            if (!$model->isValid()) {
                throw new \Exception('Invalid holiday structure for type: ' . $model->holiday_type);
            }
        });
    }

    public function isValid(): bool
    {
        if ($this->holiday_type === 'specific') {
            if ($this->date !== null && $this->start_date === null && $this->end_date === null && $this->recurring_day === null) {
                return true;
            } elseif ($this->date === null && $this->start_date !== null && $this->end_date !== null && $this->recurring_day === null) {
                return true;
            }
        } elseif ($this->holiday_type === 'recurring') {
            if ($this->recurring_day !== null && $this->date === null && $this->start_date === null && $this->end_date === null) {
                return true;
            }
        }

        return false;
    }
    /**
     * Safe create with friendly error handling
     */
    public static function safeCreate(array $attributes): self
    {
        try {
            return self::create($attributes);
        } catch (QueryException $e) {
            throw self::translateConstraintException($e);
        }
    }
    
    private static function translateConstraintException(QueryException $e): \Exception
    {
        $message = $e->getMessage();
    
        if (str_contains($message, 'unique_venue_holiday_date')) {
            return new \Exception('A holiday with this name and date already exists for this venue.', 409);
        }
    
        if (str_contains($message, 'unique_venue_holiday_range')) {
            return new \Exception('A holiday with this name and date range already exists for this venue.', 409);
        }
    
        if (str_contains($message, 'unique_venue_holiday_recurring')) {
            return new \Exception('A recurring holiday with this name and weekday already exists for this venue.', 409);
        }
    
        Log::error('Unhandled VenueHoliday DB error', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
    
        return new \Exception('Unexpected error while saving holiday.', 500);
    }
}
