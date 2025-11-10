import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash, Edit, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { fetchPrograms, addProgram, updateProgram, deleteProgram, Program as ProgramType, setProgramSearch, setCurrentPage } from '@/store/program/programSlice';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink, PaginationEllipsis } from '@/components/ui/pagination';
import { InputWithIcon } from '@/components/ui/input-with-icon';

const PER_PAGE = 10;

const ProgramManagementTable: React.FC = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { programs, loading, error, totalPrograms, currentPage, totalPages, perPage, search } = useAppSelector((state) => state.programs);
  const [newProgram, setNewProgram] = useState<Omit<ProgramType, 'id'>>({ name: '', description: '' });
  const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<ProgramType | null>(null);
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== search) {
        dispatch(setProgramSearch(localSearch));
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const handleClearSearch = () => {
    setLocalSearch('');
    dispatch(setProgramSearch(''));
  };

  const handleAddProgram = async () => {
    if (!newProgram.name.trim()) {
      toast({ title: 'Missing Information', description: 'Program name is required.', variant: 'destructive' });
      return;
    }
    if (editingProgramId) {
      try {
        await dispatch(updateProgram({ ...newProgram, id: editingProgramId })).unwrap();
        toast({ title: 'Program Updated', description: `${newProgram.name} has been updated.` });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to update program.', variant: 'destructive' });
      }
    } else {
      try {
        await dispatch(addProgram(newProgram)).unwrap();
        toast({ title: 'Program Added', description: `${newProgram.name} has been added to programs.` });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to add program.', variant: 'destructive' });
      }
    }
    setNewProgram({ name: '', description: '' });
    setEditingProgramId(null);
    setIsProgramDialogOpen(false);
  };

  const handleEditProgram = (program: ProgramType) => {
    setNewProgram({ name: program.name, description: program.description });
    setEditingProgramId(program.id);
    setIsProgramDialogOpen(true);
  };

  const handleDeleteProgram = async (id: number) => {
    try {
      await dispatch(deleteProgram(id)).unwrap();
      toast({ title: 'Program Deleted', description: 'The program has been removed.' });
      setIsDeleteDialogOpen(false);
      setProgramToDelete(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete program.', variant: 'destructive' });
    }
  };

  const confirmDelete = () => {
    if (programToDelete) {
      handleDeleteProgram(programToDelete.id);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setProgramToDelete(null);
  };

  // Pagination navigation
  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  useEffect(() => {
    dispatch(fetchPrograms({ page: currentPage, perPage, search }));
  }, [dispatch, currentPage, perPage, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-medium">All Programs</h3>
        <div className="w-full sm:w-1/3 relative">
          <InputWithIcon
            placeholder="Search programs..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="w-full pr-10"
            icon={Search}
          />
          {localSearch && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProgramId ? 'Edit Program' : 'Add New Program'}</DialogTitle>
              <DialogDescription>
                {editingProgramId ? 'Update the program details below.' : 'Enter the details for the new program.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="programName" className="text-right">Name</Label>
                <Input id="programName" className="col-span-3" value={newProgram.name} onChange={e => setNewProgram({ ...newProgram, name: e.target.value })} maxLength={50} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="programDescription" className="text-right">Description</Label>
                <Input id="programDescription" className="col-span-3" value={newProgram.description} onChange={e => setNewProgram({ ...newProgram, description: e.target.value })} maxLength={100} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddProgram}>{editingProgramId ? 'Update Program' : 'Add Program'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{programToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Program</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border rounded-md overflow-hidden">
        {loading ? (
          <p className="p-4 text-center text-gray-500">Loading programs...</p>
        ) : error ? (
          <p className="p-4 text-center text-red-500">Error: {error}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <p className="text-gray-500">Loading programs...</p>
                  </TableCell>
                </TableRow>
              )}
              {!loading && programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <p className="text-gray-500 text-lg">No programs found.</p>
                    {!search && <p className="text-gray-400 text-sm">Click "Add Program" to create one.</p>}
                    {search && <p className="text-gray-400 text-sm">Try adjusting your search criteria.</p>}
                  </TableCell>
                </TableRow>
              )}
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>{program.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditProgram(program)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setIsDeleteDialogOpen(true); setProgramToDelete(program); }}>
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === currentPage}
                      onClick={() => handlePageChange(pageNumber)}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                (pageNumber === 2 && currentPage > 3) ||
                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return <PaginationEllipsis key={pageNumber} />;
              }
              return null;
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ProgramManagementTable; 