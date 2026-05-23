import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditCampForm from "@/components/forms/EditCampForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Camp | Admin" };

export default async function EditCampPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: camp, error } = await supabase
    .from("camps")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !camp) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href={`/admin/camps/${id}`} className="hover:text-[#5B21B6]">
          {camp.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Camp</h1>
      <EditCampForm camp={camp} />
    </div>
  );
}
