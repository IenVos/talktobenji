import type { Metadata } from "next";
import ChatPageClient from "../ChatPageClient";

export const metadata: Metadata = {
  title: "Praat met Benji | Direct een luisterend oor, dag en nacht",
};

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function Page({ searchParams }: PageProps) {
  return <ChatPageClient searchParams={searchParams ?? {}} />;
}
