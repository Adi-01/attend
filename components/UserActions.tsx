// @/components/UserActions.tsx
"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, Edit, Trash2, Loader2 } from "lucide-react";
import { editUserAction, deleteUserAction } from "@/lib/actions/admin.actions";

export default function UserActions({ user }: { user: any }) {
  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form/Loading state
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState<"admin" | "user">(
    user.labels?.includes("admin") ? "admin" : "user",
  );
  const [phone, setPhone] = useState(user.prefs?.phone || "");

  const [loading, setLoading] = useState(false);

  const handleEditSubmit = async () => {
    setLoading(true);
    const res = await editUserAction(user.$id, { name, email, role, phone });
    setLoading(false);

    if (res.success) {
      setIsEditOpen(false);
    } else {
      alert(res.error || "Failed to update user");
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteUserAction(user.$id);
    setLoading(false);

    if (res.success) {
      setIsDeleteOpen(false);
    } else {
      alert(res.error || "Failed to delete user");
    }
  };

  return (
    <>
      {/* 1. ELLIPSIS DROPDOWN MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-neutral-800 rounded-full"
          >
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4 text-neutral-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-neutral-900 border-neutral-800 text-neutral-200"
        >
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setIsEditOpen(true)}
            className="hover:bg-neutral-800 hover:text-white cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit User
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="hover:bg-neutral-800 hover:text-red-400 text-red-400 cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 2. EDIT USER DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {/* NAME INPUT */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-neutral-400">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black border-neutral-700 text-white focus-visible:ring-indigo-500"
                placeholder="Enter full name"
              />
            </div>

            {/* EMAIL INPUT */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-neutral-400">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black border-neutral-700 text-white focus-visible:ring-indigo-500"
                placeholder="email@example.com"
              />
            </div>

            {/* ROLE DROPDOWN */}
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-400">System Role</Label>
              <Select
                value={role}
                onValueChange={(v: "admin" | "user") => setRole(v)}
              >
                <SelectTrigger className="w-full bg-black border-neutral-700 text-white focus:ring-indigo-500">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl">
                  <SelectItem
                    value="user"
                    className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                  >
                    User
                  </SelectItem>
                  <SelectItem
                    value="admin"
                    className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                  >
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PHONE INPUT */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone" className="text-neutral-400">
                Phone Number (Preference)
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-black border-neutral-700 text-white focus-visible:ring-indigo-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-neutral-400">
            Are you sure you want to delete{" "}
            <strong className="text-white">{user.name || user.email}</strong>?
            This action cannot be undone and will permanently remove their
            account.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Yes, Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
