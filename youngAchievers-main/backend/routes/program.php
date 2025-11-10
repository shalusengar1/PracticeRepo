<?php

use App\Http\Controllers\Program\ProgramController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    Route::get('programs', [ProgramController::class, 'index']);
    Route::post('programs', [ProgramController::class, 'store']);
    Route::get('programs/with-member-count', [ProgramController::class, 'getProgramsWithMemberCount']);
    Route::get('programs/{program}', [ProgramController::class, 'show']);
    Route::put('programs/{program}', [ProgramController::class, 'update']);
    Route::delete('programs/{program}', [ProgramController::class, 'destroy']);
});
