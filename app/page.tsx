import ChatPageClient from "./ChatPageClient";

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function Page({ searchParams }: PageProps) {
  return <ChatPageClient searchParams={searchParams ?? {}} />;
}
