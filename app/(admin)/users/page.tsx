// app/users/page.tsx
import { getUsersList } from "@/lib/actions/admin.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
import UserActions from "@/components/UserActions";
import AddUserModal from "@/components/AddUserModal";

export default async function UsersPage() {
  const { total, users } = await getUsersList();

  return (
    <div className="mx-6 md:mx-14 text-white my-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-medium">User Directory</h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-full shadow-lg">
            <Users className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-300">
              Total Users: <strong className="text-white ml-1">{total}</strong>
            </span>
          </div>

          <AddUserModal />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="overflow-x-auto rounded-md border border-neutral-800">
        <Table className="bg-black">
          <TableHeader className="bg-neutral-900 text-white">
            <TableRow className="*:border-neutral-700 [&>:not(:last-child)]:border-r">
              {["NAME", "EMAIL", "ROLE", "PHONE", ""].map((h, i) => (
                <TableHead
                  key={i}
                  className={`min-w-[150px] ${h === "" ? "w-[50px] min-w-[50px]" : ""}`}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow className="*:border-neutral-700 hover:bg-neutral-800/40">
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-neutral-500"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.$id}
                  className="*:border-neutral-700 [&>:not(:last-child)]:border-r bg-black hover:bg-neutral-800/40 group"
                >
                  <TableCell className="font-medium text-neutral-200">
                    {user.name || (
                      <span className="text-neutral-600 italic">No name</span>
                    )}
                  </TableCell>

                  <TableCell className="text-neutral-300">
                    {user.email}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center">
                      {user.labels && user.labels.length > 0 ? (
                        user.labels.map((label: string) => (
                          <span
                            key={label}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700"
                          >
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-cyan-500 border border-neutral-700">
                          user
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-neutral-400 text-sm font-mono max-w-xs truncate">
                    {Object.keys(user.prefs).length > 0 && user.prefs.phone ? (
                      user.prefs.phone
                    ) : (
                      <span className="font-sans text-neutral-600">None</span>
                    )}
                  </TableCell>

                  {/* ACTIONS COLUMN */}
                  <TableCell className="w-[50px] p-0 text-center">
                    <UserActions user={user} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
