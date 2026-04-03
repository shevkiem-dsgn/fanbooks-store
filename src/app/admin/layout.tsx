import { requireAdmin } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  await requireAdmin();

  return <>{children}</>;
}