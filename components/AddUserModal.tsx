// @/components/AddUserModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react"; // <-- Imported Eye and EyeOff
import { createUserAction } from "@/lib/actions/admin.actions";

export default function AddUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [phone, setPhone] = useState("");

  // <-- Added state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      alert("Email and Password are required.");
      return;
    }

    setLoading(true);
    const res = await createUserAction({ name, email, password, role, phone });
    setLoading(false);

    if (res.success) {
      setIsOpen(false);
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setPhone("");
      setShowPassword(false); // Reset visibility on close
    } else {
      alert(res.error || "Failed to create user");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg gap-2">
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="newName" className="text-neutral-400">
              Name
            </Label>
            <Input
              id="newName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black border-neutral-700 text-white focus-visible:ring-indigo-500"
              placeholder="Full Name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="newEmail" className="text-neutral-400">
              Email Address *
            </Label>
            <Input
              id="newEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black border-neutral-700 text-white focus-visible:ring-indigo-500"
              placeholder="user@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword" className="text-neutral-400">
              Password * (Min 8 chars)
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"} // <-- Conditionally change type
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black border-neutral-700 text-white focus-visible:ring-indigo-500 pr-10" // <-- Added pr-10 so text doesn't hide behind the icon
                placeholder="••••••••"
              />
              {/* <-- Toggle Button overlayed on the input --> */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

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

          <div className="flex flex-col gap-2">
            <Label htmlFor="newPhone" className="text-neutral-400">
              Phone Number
            </Label>
            <Input
              id="newPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-black border-neutral-700 text-white focus-visible:ring-indigo-500"
              placeholder="Phone number"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Create User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
