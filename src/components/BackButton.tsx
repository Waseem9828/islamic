"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function BackButton({ href, text = "واپس جائیں" }: { href: string, text?: string }) {
  return (
    <Link href={href} passHref>
      <Button variant="outline" className="bg-islamic-gold/20 text-white border-islamic-gold hover:bg-islamic-gold hover:text-islamic-dark">
        <span>{text}</span>
        <ArrowRight className="mr-2 h-4 w-4" />
      </Button>
    </Link>
  );
}
