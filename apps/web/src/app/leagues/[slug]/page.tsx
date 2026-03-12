import { redirect } from 'next/navigation';

export default function LeaguePage({ params }: { params: { slug: string } }) {
  redirect(`/leagues/${params.slug}/fixtures`);
}
