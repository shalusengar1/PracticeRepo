import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Edit } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks/hooks";
import {
  fetchPrograms,
  addProgram,
  updateProgram,
  deleteProgram,
  Program as ProgramType,
} from "@/store/program/programSlice";
import AmenitiesComponent from "@/components/AmenitiesComponent";
import ProgramManagementTable from '@/components/ProgramManagementTable';

const VenueConfigurations: React.FC = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
 
  const [newProgram, setNewProgram] = useState<Omit<ProgramType, 'id'>>({ name: '', description: '' });
  const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<ProgramType | null>(null);
  

  // Program functions
  const handleAddProgram = async () => {
    if (!newProgram.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Program name is required.",
        variant: "destructive"
      });
      return;
    }
    if (editingProgramId) {
      try {
        await dispatch(updateProgram({ ...newProgram, id: editingProgramId })).unwrap();
        toast({
          title: "Program Updated",
          description: `${newProgram.name} has been updated.`
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to update program.",
          variant: "destructive",
        });
      }
    } else {
      try {
        await dispatch(addProgram(newProgram)).unwrap();
        toast({
          title: "Program Added",
          description: `${newProgram.name} has been added to programs.`
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to add program.",
          variant: "destructive",
        });
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
      toast({
        title: "Program Deleted",
        description: "The program has been removed."
      });
      setIsDeleteDialogOpen(false);
      setProgramToDelete(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete program.",
        variant: "destructive",
      });
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
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="programs" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
        </TabsList>
        
        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4 pt-4">
          <ProgramManagementTable />
        </TabsContent>
        
        {/* Amenities Tab */}
        <TabsContent value="amenities" className="space-y-4 pt-4">
          <AmenitiesComponent 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VenueConfigurations;
