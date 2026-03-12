import { redirect } from 'next/navigation';

export default function TeamPage({ params }: { params: { slug: string } }) {
  redirect(`/teams/${params.slug}/fixtures`);
}
