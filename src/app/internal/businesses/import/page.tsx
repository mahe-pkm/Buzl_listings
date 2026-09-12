import { redirect } from 'next/navigation';

export default function InternalImportRedirectPage() {
  redirect('/admin/businesses/import');
}
