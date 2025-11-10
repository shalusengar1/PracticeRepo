<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VenueRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Assuming authenticated users can create/update venues
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'venue_name' => 'required|string|max:100',
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'venue_admin_ids' => 'nullable|array',
            'venue_admin_ids.*' => 'integer|exists:admin_users,id',
        ];

        // Add status validation for updates
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $rules['status'] = 'required|in:active,inactive,deleted';
        }

        return $rules;
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'venue_name.required' => 'Venue name is required.',
            'venue_name.max' => 'Venue name must not exceed 100 characters.',
            'address.max' => 'Address must not exceed 255 characters.',
            'description.max' => 'Description must not exceed 500 characters.',
            'latitude.numeric' => 'Latitude must be a valid number.',
            'latitude.between' => 'Latitude must be between -90 and 90 degrees.',
            'longitude.numeric' => 'Longitude must be a valid number.',
            'longitude.between' => 'Longitude must be between -180 and 180 degrees.',
            'venue_admin_ids.array' => 'Venue admin IDs must be an array.',
            'venue_admin_ids.*.integer' => 'Each venue admin ID must be an integer.',
            'venue_admin_ids.*.exists' => 'One or more venue admin IDs do not exist.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be active, inactive, or deleted.',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Check if coordinates are provided together
            $latitude = $this->input('latitude');
            $longitude = $this->input('longitude');
            
            if (($latitude !== null && $longitude === null) || ($latitude === null && $longitude !== null)) {
                $validator->errors()->add('latitude', 'Both latitude and longitude must be provided together.');
            }
        });
    }
}
