<?php

namespace App\Http\Controllers\Program;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\DB;
use App\Models\Member;

class ProgramController extends Controller
{
    use LogsActivity; 
    /**
     * Display a listing of the programs.
     */
    public function index(): JsonResponse
    {
        try {
            $fields = request()->query('fields');
            $query = Program::query();

            if ($fields) {
                $fieldsArray = explode(',', $fields);
                if (!in_array('id', $fieldsArray) && count($fieldsArray) > 0) {
                    array_unshift($fieldsArray, 'id');
                }
                if (!in_array('name', $fieldsArray) && count($fieldsArray) > 0) {
                    array_unshift($fieldsArray, 'name');
                }
                $query->select($fieldsArray);
            }

            // Search filter
            if ($search = request()->query('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Pagination
            $perPage = request()->query('per_page', 10);
            $paginate = filter_var(request()->query('paginate', true), FILTER_VALIDATE_BOOLEAN);
            if ($paginate) {
                $programs = $query->orderBy('created_at', 'desc')->paginate($perPage);
                return response()->json($programs);
            } else {
            $programs = $query->orderBy('created_at', 'desc')->get();
            return response()->json([
                'message' => 'Programs retrieved successfully',
                'data' => $programs,
            ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to fetch programs', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while retrieving programs',
            ], 500);
        }
    }

    /**
     * Get a paginated list of programs with their member counts for the member management page.
     */
    public function getProgramsWithMemberCount(Request $request): JsonResponse
    {
        try {
            $perPage = $request->query('per_page', 10);

            // Using a subquery to get the distinct count of members for each program
            $programs = Program::select('programs.*')
                ->addSelect(DB::raw('(SELECT COUNT(DISTINCT batch_members.member_id) 
                                      FROM batch_members
                                      JOIN batches ON batches.id = batch_members.batch_id
                                      WHERE batches.program_id = programs.id 
                                      AND batches.deleted_at IS NULL) as members_count'))
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            $totalEnrolledMembers = Member::whereHas('batches')->distinct()->count('members.id');
            
            $paginatedData = $programs->toArray();
            $paginatedData['total_enrolled_members'] = $totalEnrolledMembers;

            return response()->json($paginatedData);

        } catch (\Exception $e) {
            Log::error('Failed to fetch programs with member count', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Something went wrong while retrieving programs',
            ], 500);
        }
    }

    /**
     * Store a newly created program in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $programData = $request->all();
            $programData['created_by'] = Auth::id();
            $programData['updated_by'] = Auth::id(); // Also set updated_by on creation

            $program = Program::create($programData);

            // Log activity
            $this->logProgramAction(
                'Program Created',
                $program,
                "Program \"{$program->name}\" was created",
                null, // Old values are null for a new record
                // $program->toArray() // New values are the attributes of the created program
                // The logProgramAction in trait already handles toArray for newValues if 4th param is null
            );

            return response()->json([
                'message' => 'Program created successfully',
                'data' => $program,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create program', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while creating the program',
            ], 500);
        }
    }

    /**
     * Display the specified program.
     */
    public function show(Program $program): JsonResponse
    {
        try {
            return response()->json([
                'message' => 'Program retrieved successfully',
                'data' => $program,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch program', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while retrieving the program',
            ], 500);
        }
    }

    /**
     * Update the specified program in storage.
     */
    public function update(Request $request, Program $program): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $originalProgramData = $program->getOriginal();
            $updateData = $request->all();
            $updateData['updated_by'] = Auth::id();

            $program->update($updateData);
            $changedAttributes = $program->getChanges(); // Get attributes that were changed
            
            $logDetailsParts = [];
            $oldValuesForLog = [];
            $newValuesForLog = [];

            // Exclude timestamps and other system-managed fields from the log message if desired
            $excludedFromLogMessage = ['updated_at', 'created_at', 'updated_by', 'created_by'];

            foreach ($changedAttributes as $key => $newValue) {
                if (in_array($key, $excludedFromLogMessage)) {
                    // Still log old/new values for these if they changed, but don't include in the summary message
                     if (array_key_exists($key, $originalProgramData)) {
                        $oldValuesForLog[$key] = $originalProgramData[$key];
                        $newValuesForLog[$key] = $newValue;
                    }
                    continue;
                }

                $oldValue = $originalProgramData[$key] ?? null;
                $logDetailsParts[] = " {$key} changed from \"{$oldValue}\" to \"{$newValue}\"";
                $oldValuesForLog[$key] = $oldValue;
                $newValuesForLog[$key] = $newValue;
            }
            
            $detailsMessage = "Program \"{$program->name}\" was updated ,";
            if (!empty($logDetailsParts)) {
                $detailsMessage .= implode(', ', $logDetailsParts) . ".";
            }


            if (!empty($oldValuesForLog)) { // Log only if there were changes
                $this->logProgramAction(
                    'Program Updated',
                    $program,
                    $detailsMessage,
                    $oldValuesForLog, 
                    $newValuesForLog 
                );
            }

            return response()->json([
                'message' => 'Program updated successfully',
                'data' => $program,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update program', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while updating the program',
            ], 500);
        }
    }

    /**
     * Remove the specified program from storage.
     */
    public function destroy(Program $program): JsonResponse
    {
        try {

            $programDataForLog = $program->toArray(); // Get data before deletion for logging
            $programName = $program->name;

            $program->delete();

            $this->logProgramAction(
                'Program Deleted',
                $program, // Pass the model instance (it still holds ID etc.)
                "Program \"{$programName}\" was deleted",
                $programDataForLog // Old values are the program's data before deletion
            );

            return response()->json([
                'message' => 'Program deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete program', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Something went wrong while deleting the program',
            ], 500);
        }
    }
}
