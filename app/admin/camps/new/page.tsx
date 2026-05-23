import CreateCampForm from "@/components/forms/CreateCampForm";
import Link from "next/link";

export const metadata = { title: "New Camp | Admin" };

export default function NewCampPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/camps" className="hover:text-[#5B21B6]">
          Camps
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Camp</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Camp</h1>
      <p className="text-sm text-gray-500 mb-6">
        Set up a new JSF football assessment camp.
      </p>
      <CreateCampForm />
    </div>
  );
}
