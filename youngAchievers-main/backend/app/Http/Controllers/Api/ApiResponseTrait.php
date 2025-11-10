<?php
namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Contracts\Validation\Validator;

trait ApiResponseTrait
{
    protected function successResponse($data, $message = 'Operation successful', $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    protected function errorResponse($message, $statusCode = 400, $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (!is_null($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    protected function validationErrorResponse(Validator $validator): JsonResponse
    {
        return $this->errorResponse(
            'Validation Error.',
            422,
            $validator->errors()->toArray() // ->toArray() gives a cleaner structure
        );
    }

    protected function notFoundResponse($message = 'Resource not found'): JsonResponse
    {
        return $this->errorResponse($message, 404);
    }

    // Add other common responses like unauthorized, forbidden, etc.
}
