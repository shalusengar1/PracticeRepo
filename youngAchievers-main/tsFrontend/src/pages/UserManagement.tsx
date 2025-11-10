
import React from 'react';
import UserHeader from '../components/UserManagement/UserHeader';
import UserList from '../components/UserManagement/UserList';
import { Card, CardContent } from "@/components/ui/card";

const UserManagement: React.FC = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <UserHeader title="Users Management" />
      <Card>
        <CardContent className="p-3 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">User List</h2>
          <p className="text-sm text-gray-500 mb-4">
            Manage users and their permissions. Each user can be assigned different access levels for various modules.
            The permissions field displays access rights (Read, Write, Delete, Export) granted to each user.
          </p>
          <UserList />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
