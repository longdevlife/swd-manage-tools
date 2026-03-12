import { useState } from 'react';
import { Search, Users, Mail, Phone, BookOpen, Eye, UserCheck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockGroups = [
  { id: 1, name: 'Group 1', project: 'E-Commerce Platform', members: 5 },
  { id: 2, name: 'Group 2', project: 'Learning Management System', members: 4 },
  { id: 3, name: 'Group 3', project: 'Task Management App', members: 5 },
  { id: 4, name: 'Group 4', project: 'Social Media Dashboard', members: 4 },
];

const mockStudents = [
  {
    id: 1,
    name: 'Nguyen Van A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    groupId: 1,
    groupName: 'Group 1',
    role: 'Leader',
    attendance: 95,
    tasksCompleted: 12,
    tasksTotal: 15,
  },
  {
    id: 2,
    name: 'Tran Thi B',
    email: 'tranthib@example.com',
    phone: '0901234568',
    groupId: 1,
    groupName: 'Group 1',
    role: 'Member',
    attendance: 90,
    tasksCompleted: 10,
    tasksTotal: 12,
  },
  {
    id: 3,
    name: 'Le Van C',
    email: 'levanc@example.com',
    phone: '0901234569',
    groupId: 1,
    groupName: 'Group 1',
    role: 'Member',
    attendance: 88,
    tasksCompleted: 9,
    tasksTotal: 12,
  },
  {
    id: 4,
    name: 'Pham Thi D',
    email: 'phamthid@example.com',
    phone: '0901234570',
    groupId: 2,
    groupName: 'Group 2',
    role: 'Leader',
    attendance: 92,
    tasksCompleted: 11,
    tasksTotal: 13,
  },
  {
    id: 5,
    name: 'Hoang Van E',
    email: 'hoangvane@example.com',
    phone: '0901234571',
    groupId: 2,
    groupName: 'Group 2',
    role: 'Member',
    attendance: 85,
    tasksCompleted: 8,
    tasksTotal: 11,
  },
  {
    id: 6,
    name: 'Nguyen Thi F',
    email: 'nguyenthif@example.com',
    phone: '0901234572',
    groupId: 3,
    groupName: 'Group 3',
    role: 'Leader',
    attendance: 94,
    tasksCompleted: 13,
    tasksTotal: 14,
  },
  {
    id: 7,
    name: 'Tran Van G',
    email: 'tranvang@example.com',
    phone: '0901234573',
    groupId: 3,
    groupName: 'Group 3',
    role: 'Member',
    attendance: 87,
    tasksCompleted: 9,
    tasksTotal: 13,
  },
  {
    id: 8,
    name: 'Le Thi H',
    email: 'lethih@example.com',
    phone: '0901234574',
    groupId: 4,
    groupName: 'Group 4',
    role: 'Leader',
    attendance: 91,
    tasksCompleted: 10,
    tasksTotal: 12,
  },
];

export function LecturerConsolePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');

  // Filter students
  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === 'all' || student.groupId === parseInt(filterGroup);
    return matchesSearch && matchesGroup;
  });

  const getTaskProgress = (completed, total) => {
    return Math.round((completed / total) * 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lecturer Console</h1>
        <p className="text-sm text-muted-foreground">
          Manage student groups, monitor attendance, and track project progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Groups
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGroups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <UserCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStudents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Attendance
            </CardTitle>
            <BookOpen className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                mockStudents.reduce((sum, s) => sum + s.attendance, 0) / mockStudents.length
              )}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
            <BookOpen className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGroups.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Groups Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockGroups.map((group) => (
              <Card key={group.id} className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{group.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{group.project}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{group.members} members</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {mockGroups.map((group) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Task Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const taskProgress = getTaskProgress(student.tasksCompleted, student.tasksTotal);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {student.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{student.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{student.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.groupName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.role === 'Leader' ? 'default' : 'secondary'}>
                          {student.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={getProgressColor(student.attendance)}>
                            {student.attendance}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {student.tasksCompleted}/{student.tasksTotal} tasks
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-secondary">
                              <div
                                className={`h-2 rounded-full ${
                                  taskProgress >= 80
                                    ? 'bg-green-600'
                                    : taskProgress >= 60
                                      ? 'bg-yellow-600'
                                      : 'bg-red-600'
                                }`}
                                style={{ width: `${taskProgress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{taskProgress}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
